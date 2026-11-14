import LostFoundItem from '../models/LostFoundItem.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { extractKeywords, calculateMatchScore } from '../services/matchingService.js';
import { saveFilesToDB } from '../middleware/upload.js';

// @desc    Create a lost or found item
// @route   POST /api/lostfound
// @access  Private
export const createItem = async (req, res, next) => {
  try {
    const { type, title, category, description, dateOccurred, location } = req.body;

    const imageUrls = await saveFilesToDB(req.files, req.user._id);

    const keywords = extractKeywords(`${title} ${description}`);

    const item = await LostFoundItem.create({
      type,
      title,
      category,
      description,
      dateOccurred: new Date(dateOccurred),
      location,
      images: imageUrls,
      reportedBy: req.user._id,
      status: 'reported',
      keywords,
    });

    await logAudit(req, 'CREATE_LOSTFOUND_ITEM', 'LostFoundItem', item._id, { type, title, category });

    // Algorithm G: Compare against opposite-type items with status reported
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const candidateOpposites = await LostFoundItem.find({
      type: oppositeType,
      status: 'reported',
      _id: { $ne: item._id },
    }).populate('reportedBy', 'name email');

    const matches = [];
    for (const candidate of candidateOpposites) {
      const matchResult = calculateMatchScore(item, candidate);
      if (matchResult.score >= 50) {
        matches.push({
          item: candidate,
          score: matchResult.score,
          breakdown: matchResult.breakdown,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5);

    // If matches found, notify both parties & admins
    if (topMatches.length > 0) {
      const bestMatch = topMatches[0];

      // Notify reporter of new item
      await notify(item.reportedBy, {
        title: `Possible Match Found for your ${type} item!`,
        message: `Your reported ${type} item '${item.title}' matches a ${oppositeType} item '${bestMatch.item.title}' with ${bestMatch.score}% confidence.`,
        type: 'lostfound',
        link: `/m2/items/${item._id}`,
        sendEmailAlert: true,
      });

      // Notify reporter of opposite candidate
      await notify(bestMatch.item.reportedBy._id, {
        title: `New Potential Match for your ${oppositeType} item!`,
        message: `A newly reported ${type} item '${item.title}' matches your item '${bestMatch.item.title}' with ${bestMatch.score}% confidence.`,
        type: 'lostfound',
        link: `/m2/items/${bestMatch.item._id}`,
        sendEmailAlert: true,
      });

      // Notify admins
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      await notify(
        admins.map((a) => a._id),
        {
          title: `Lost & Found Match Detected (${bestMatch.score}%)`,
          message: `Algorithm G detected a match between Lost: '${type === 'lost' ? item.title : bestMatch.item.title}' and Found: '${type === 'found' ? item.title : bestMatch.item.title}'`,
          type: 'lostfound',
          link: '/m2/moderation',
        }
      );
    }

    const populated = await LostFoundItem.findById(item._id).populate('reportedBy', 'name email phone avatar');

    res.status(201).json({
      success: true,
      data: populated,
      meta: {
        suggestedMatchesCount: topMatches.length,
        topMatches: topMatches.map((m) => ({
          _id: m.item._id,
          title: m.item.title,
          score: m.score,
        })),
      },
      message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all lost and found items with search & filters
// @route   GET /api/lostfound
// @access  Public / Private
export const getItems = async (req, res, next) => {
  try {
    const { type, category, status, q, from, to, page = 1, limit = 15 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    if (from || to) {
      query.dateOccurred = {};
      if (from) query.dateOccurred.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.dateOccurred.$lte = toDate;
      }
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { keywords: { $in: extractKeywords(q) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      LostFoundItem.find(query)
        .populate('reportedBy', 'name email phone avatar')
        .populate('matchedWith', 'title type images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LostFoundItem.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      message: 'Items retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item detail
// @route   GET /api/lostfound/:id
// @access  Public / Private
export const getItemById = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('reportedBy', 'name email phone avatar')
      .populate('matchedWith');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Also fetch associated claims if user is admin, security, or owner
    let claims = [];
    if (req.user) {
      const isOwner = req.user._id.toString() === item.reportedBy?._id.toString();
      const isStaff = ['admin', 'security'].includes(req.user.role);
      if (isOwner || isStaff) {
        claims = await Claim.find({ item: item._id })
          .populate('claimant', 'name email phone rollNo')
          .populate('verifiedBy', 'name email');
      }
    }

    res.json({
      success: true,
      data: {
        item,
        claims,
      },
      message: 'Item details retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested matches for an item (Algorithm G)
// @route   GET /api/lostfound/:id/matches
// @access  Private
export const getSuggestedMatches = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const candidates = await LostFoundItem.find({
      type: oppositeType,
      status: { $in: ['reported', 'matched'] },
      _id: { $ne: item._id },
    }).populate('reportedBy', 'name email phone');

    const matches = [];
    for (const candidate of candidates) {
      const matchResult = calculateMatchScore(item, candidate);
      if (matchResult.score >= 50) {
        matches.push({
          item: candidate,
          score: matchResult.score,
          breakdown: matchResult.breakdown,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: matches.slice(0, 5),
      message: 'Suggested matches calculated',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm match between two items
// @route   POST /api/lostfound/:id/confirm-match
// @access  Private (admin, security, or item owner)
export const confirmMatch = async (req, res, next) => {
  try {
    const { targetItemId } = req.body;
    if (!targetItemId) {
      return res.status(400).json({
        success: false,
        message: 'targetItemId is required to confirm match',
      });
    }

    const itemA = await LostFoundItem.findById(req.params.id);
    const itemB = await LostFoundItem.findById(targetItemId);

    if (!itemA || !itemB) {
      return res.status(404).json({
        success: false,
        message: 'One or both items not found',
      });
    }

    // Permission: Admin, Security, or Owner of either item
    const isOwner =
      req.user._id.toString() === itemA.reportedBy.toString() ||
      req.user._id.toString() === itemB.reportedBy.toString();
    const isStaff = ['admin', 'security'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this match',
      });
    }

    itemA.status = 'matched';
    itemA.matchedWith = itemB._id;
    await itemA.save();

    itemB.status = 'matched';
    itemB.matchedWith = itemA._id;
    await itemB.save();

    await logAudit(req, 'CONFIRM_MATCH', 'LostFoundItem', itemA._id, {
      matchedWith: itemB._id,
    });

    // Notify both reporters
    await notify([itemA.reportedBy, itemB.reportedBy], {
      title: 'Lost & Found Match Confirmed!',
      message: `A confirmed match has been established between '${itemA.title}' and '${itemB.title}'. Please contact campus security/admin to retrieve.`,
      type: 'lostfound',
      link: `/m2/items/${itemA._id}`,
      sendEmailAlert: true,
    });

    res.json({
      success: true,
      data: { itemA, itemB },
      message: 'Match confirmed successfully! Both items set to status: matched.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    File a claim on an item
// @route   POST /api/lostfound/:id/claims
// @access  Private (student, faculty, etc.)
export const createClaim = async (req, res, next) => {
  try {
    const { proofDescription } = req.body;
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const existingClaim = await Claim.findOne({
      item: item._id,
      claimant: req.user._id,
    });
    if (existingClaim) {
      return res.status(409).json({
        success: false,
        message: 'You have already filed a claim on this item',
      });
    }

    const proofImages = await saveFilesToDB(req.files, req.user._id);

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      proofDescription,
      proofImages,
      status: 'pending',
    });

    await logAudit(req, 'CREATE_CLAIM', 'Claim', claim._id, { itemId: item._id });

    // Notify item owner and security
    await notify(item.reportedBy, {
      title: 'New Ownership Claim Filed',
      message: `${req.user.name} filed an ownership claim on '${item.title}'`,
      type: 'lostfound',
      link: `/m2/items/${item._id}`,
    });

    const securityUsers = await User.find({ role: { $in: ['security', 'admin'] }, isActive: true }).select('_id');
    await notify(
      securityUsers.map((s) => s._id),
      {
        title: 'New Claim Awaiting Verification',
        message: `Claim filed by ${req.user.name} on item '${item.title}'`,
        type: 'lostfound',
        link: '/m2/moderation',
      }
    );

    res.status(201).json({
      success: true,
      data: claim,
      message: 'Claim filed successfully and forwarded for verification',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claims
// @route   GET /api/claims
// @access  Private (admin, security, or own)
export const getClaims = async (req, res, next) => {
  try {
    const query = {};
    if (!['admin', 'security'].includes(req.user.role)) {
      query.claimant = req.user._id;
    }

    const claims = await Claim.find(query)
      .populate('item')
      .populate('claimant', 'name email phone rollNo')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: claims,
      message: 'Claims retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject claim
// @route   PATCH /api/claims/:id/decision
// @access  Private (admin, security)
export const decideClaim = async (req, res, next) => {
  try {
    const { status, remark } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'",
      });
    }

    const claim = await Claim.findById(req.params.id).populate('item claimant');
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
      });
    }

    claim.status = status;
    claim.remark = remark || '';
    claim.verifiedBy = req.user._id;
    await claim.save();

    if (status === 'approved') {
      const item = await LostFoundItem.findById(claim.item._id);
      if (item) {
        item.status = 'claimed';
        await item.save();
      }
    }

    await logAudit(req, `CLAIM_${status.toUpperCase()}`, 'Claim', claim._id, {
      status,
      itemId: claim.item?._id,
    });

    // Notify claimant
    await notify(claim.claimant._id, {
      title: `Ownership Claim ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your claim on item '${claim.item?.title}' has been ${status}. Remark: ${remark || 'None'}`,
      type: 'lostfound',
      link: `/m2/items/${claim.item?._id}`,
      sendEmailAlert: true,
    });

    res.json({
      success: true,
      data: claim,
      message: `Claim has been ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
