import Visitor from '../models/Visitor.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { generateVisitorPassCode } from '../services/attendanceCrypto.js';
import { generateQRCodeBuffer, generateQRCodeDataURL } from '../utils/qr.js';

// @desc    Register a new visitor or pre-register by host
// @route   POST /api/visitors
// @access  Private (security, faculty, student, admin)
export const registerVisitor = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      purpose,
      personToMeet,
      idProofType,
      idProofNumber,
      expectedDate,
    } = req.body;

    const passCode = generateVisitorPassCode();
    const isPreRegistered = req.user.role !== 'security';

    const visitor = await Visitor.create({
      name,
      phone,
      email: email || '',
      purpose,
      personToMeet,
      idProofType: idProofType || 'National ID',
      idProofNumber: idProofNumber || 'TEMP-ID',
      passCode,
      preRegistered: isPreRegistered,
      expectedDate: expectedDate ? new Date(expectedDate) : new Date(),
      status: 'expected',
      registeredBy: req.user._id,
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('personToMeet', 'name email department phone')
      .populate('registeredBy', 'name email role');

    await logAudit(req, 'REGISTER_VISITOR', 'Visitor', visitor._id, {
      passCode,
      name,
      personToMeet,
    });

    // Notify host if registered by security
    if (req.user.role === 'security') {
      await notify(personToMeet, {
        title: 'Visitor Registered to Meet You',
        message: `${name} has registered at security gate to meet you for: '${purpose}'. Pass: ${passCode}`,
        type: 'visitor',
        link: '/m3/visitors/on-campus',
        sendEmailAlert: true,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Visitor registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visitors with search/filter
// @route   GET /api/visitors
// @access  Private
export const getVisitors = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { passCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [visitors, total] = await Promise.all([
      Visitor.find(query)
        .populate('personToMeet', 'name email department phone')
        .populate('registeredBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Visitor.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: visitors,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      message: 'Visitors retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan visitor pass (Algorithm F)
// @route   POST /api/visitors/scan
// @access  Private (security, admin)
// Algorithm F:
// Scan once -> checked_in (store time, notify host)
// Scan again -> checked_out
// Third scan -> error "Pass already used"
export const scanVisitorPass = async (req, res, next) => {
  try {
    const { passCode } = req.body;
    if (!passCode) {
      return res.status(400).json({
        success: false,
        message: 'Pass code is required',
      });
    }

    const cleanPassCode = passCode.toUpperCase().trim();
    const visitor = await Visitor.findOne({ passCode: cleanPassCode }).populate(
      'personToMeet',
      'name email department phone'
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Invalid visitor pass code: No record found',
      });
    }

    // 1st Scan: expected -> checked_in
    if (visitor.status === 'expected') {
      visitor.status = 'checked_in';
      visitor.checkInAt = new Date();
      await visitor.save();

      await logAudit(req, 'VISITOR_CHECK_IN', 'Visitor', visitor._id, { passCode: cleanPassCode });

      // Notify host
      if (visitor.personToMeet?._id) {
        await notify(visitor.personToMeet._id, {
          title: 'Your Visitor Has Checked In',
          message: `${visitor.name} has checked in at the campus security gate and is heading to meet you.`,
          type: 'visitor',
          link: '/m3/visitors/on-campus',
          sendEmailAlert: true,
        });
      }

      return res.json({
        success: true,
        action: 'checked_in',
        data: visitor,
        message: `Check-in successful: Welcome ${visitor.name}. Host ${visitor.personToMeet?.name} notified.`,
      });
    }

    // 2nd Scan: checked_in -> checked_out
    if (visitor.status === 'checked_in') {
      visitor.status = 'checked_out';
      visitor.checkOutAt = new Date();
      await visitor.save();

      await logAudit(req, 'VISITOR_CHECK_OUT', 'Visitor', visitor._id, { passCode: cleanPassCode });

      return res.json({
        success: true,
        action: 'checked_out',
        data: visitor,
        message: `Check-out successful: Goodbye ${visitor.name}. Pass has been completed.`,
      });
    }

    // 3rd Scan onwards: checked_out or cancelled -> error (Acceptance Test 5)
    if (visitor.status === 'checked_out' || visitor.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        action: 'error',
        message: 'Pass already used. This visitor pass has already been checked out and expired.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently on-campus visitors
// @route   GET /api/visitors/on-campus
// @access  Private (security, admin, faculty)
export const getOnCampusVisitors = async (req, res, next) => {
  try {
    const onCampus = await Visitor.find({ status: 'checked_in' })
      .populate('personToMeet', 'name email department phone')
      .sort({ checkInAt: -1 });

    res.json({
      success: true,
      data: onCampus,
      meta: {
        totalOnCampus: onCampus.length,
      },
      message: 'On-campus visitors retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Visitor Pass QR PNG Image Buffer or Data URL
// @route   GET /api/visitors/:id/pass
// @access  Private
export const getVisitorPassQR = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id).populate('personToMeet', 'name');
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    // Generate PNG Buffer
    const qrBuffer = await generateQRCodeBuffer(visitor.passCode);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="pass_${visitor.passCode}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    next(error);
  }
};
