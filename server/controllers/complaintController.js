import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { getIO } from '../services/socket.js';
import { calculateSlaDueAt } from '../services/slaCron.js';
import { saveFilesToDB } from '../middleware/upload.js';

// Status transition order
const STATUS_ORDER = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'];

// Helper to generate Ticket ID "CMP-YYYY-0001"
const generateTicketId = async () => {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;
  const latestComplaint = await Complaint.findOne({
    ticketId: { $regex: `^${prefix}` },
  }).sort({ ticketId: -1 });

  let seq = 1;
  if (latestComplaint && latestComplaint.ticketId) {
    const parts = latestComplaint.ticketId.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) seq = lastNum + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// @desc    Raise a new complaint
// @route   POST /api/complaints
// @access  Private (student, faculty, admin)
export const createComplaint = async (req, res, next) => {
  try {
    const { category, building, room, description, priority = 'medium' } = req.body;

    const ticketId = await generateTicketId();
    const images = await saveFilesToDB(req.files, req.user._id, 'complaint');
    const slaDueAt = calculateSlaDueAt(priority);

    const initialTimeline = [
      {
        status: 'submitted',
        by: req.user._id,
        remark: 'Complaint ticket created by user',
        at: new Date(),
        images,
      },
    ];

    const complaint = await Complaint.create({
      ticketId,
      raisedBy: req.user._id,
      category,
      building,
      room,
      description,
      priority,
      images,
      status: 'submitted',
      slaDueAt,
      timeline: initialTimeline,
    });

    const populated = await Complaint.findById(complaint._id)
      .populate('raisedBy', 'name email phone department')
      .populate('timeline.by', 'name role');

    await logAudit(req, 'RAISE_COMPLAINT', 'Complaint', complaint._id, {
      ticketId,
      category,
      priority,
    });

    // Notify Admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await notify(
      admins.map((a) => a._id),
      {
        title: `New Maintenance Ticket: ${ticketId}`,
        message: `${req.user.name} reported a ${priority} priority ${category} issue in ${building} ${room}`,
        type: 'complaint',
        link: `/m4/complaints/${complaint._id}`,
      }
    );

    const io = getIO();
    if (io) {
      io.emit('complaint:updated', { ticketId, status: 'submitted' });
    }

    res.status(201).json({
      success: true,
      data: populated,
      message: `Complaint ticket ${ticketId} raised successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints (role-filtered)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const query = {};

    // Role Filtering:
    // Students / Faculty: only complaints raised by themselves
    // Maintenance: only complaints assigned to them (or submitted if unassigned)
    // Admin: all complaints
    if (['student', 'faculty'].includes(req.user.role)) {
      query.raisedBy = req.user._id;
    } else if (req.user.role === 'maintenance') {
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('raisedBy', 'name email department phone')
        .populate('assignedTo', 'name email phone')
        .populate('timeline.by', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: complaints,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      message: 'Complaints retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint detail with full timeline
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('raisedBy', 'name email department phone')
      .populate('assignedTo', 'name email phone')
      .populate('timeline.by', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role guard: student can only view own ticket unless staff
    if (
      ['student', 'faculty'].includes(req.user.role) &&
      complaint.raisedBy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to this ticket' });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin assigns complaint to maintenance staff
// @route   PATCH /api/complaints/:id/assign
// @access  Private (admin)
export const assignComplaint = async (req, res, next) => {
  try {
    const { assignedTo, remark } = req.body;
    const staff = await User.findById(assignedTo);
    if (!staff || staff.role !== 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff assignment: must be an active maintenance user',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedTo = staff._id;
    complaint.status = 'assigned';
    complaint.timeline.push({
      status: 'assigned',
      by: req.user._id,
      remark: remark || `Ticket assigned to maintenance technician ${staff.name}`,
      at: new Date(),
    });

    await complaint.save();

    await logAudit(req, 'ASSIGN_COMPLAINT', 'Complaint', complaint._id, {
      ticketId: complaint.ticketId,
      assignedTo: staff._id,
    });

    // Notify maintenance technician
    await notify(staff._id, {
      title: `Task Assigned: ${complaint.ticketId}`,
      message: `You have been assigned ${complaint.priority} priority complaint in ${complaint.building} ${complaint.room}`,
      type: 'complaint',
      link: `/m4/complaints/${complaint._id}`,
      sendEmailAlert: true,
    });

    // Notify complainant
    await notify(complaint.raisedBy, {
      title: `Complaint Assigned: ${complaint.ticketId}`,
      message: `Your complaint has been assigned to technician ${staff.name}`,
      type: 'complaint',
      link: `/m4/complaints/${complaint._id}`,
    });

    const io = getIO();
    if (io) {
      io.emit('complaint:updated', { ticketId: complaint.ticketId, status: 'assigned' });
    }

    const populated = await Complaint.findById(complaint._id)
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('timeline.by', 'name role');

    res.json({
      success: true,
      data: populated,
      message: `Ticket ${complaint.ticketId} assigned to ${staff.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status forward (Algorithm H)
// @route   PATCH /api/complaints/:id/status
// @access  Private (maintenance, admin)
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, remark } = req.body;
    const afterImages = await saveFilesToDB(req.files, req.user._id, 'complaint');

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role check: maintenance can only update their assigned tickets
    if (
      req.user.role === 'maintenance' &&
      complaint.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this ticket' });
    }

    // Algorithm H: Status transitions only forward: submitted -> assigned -> in_progress -> resolved -> closed
    // Closed only by admin or complainant submitting feedback
    const currentIndex = STATUS_ORDER.indexOf(complaint.status);
    const targetIndex = STATUS_ORDER.indexOf(status);

    if (targetIndex <= currentIndex) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Status can only advance forward (${complaint.status} -> ${status} is disallowed)`,
      });
    }

    if (status === 'closed' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tickets can only be closed by Administrator or by complainant submitting feedback',
      });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      by: req.user._id,
      remark: remark || `Status advanced to ${status}`,
      at: new Date(),
      images: afterImages,
    });

    await complaint.save();

    await logAudit(req, `COMPLAINT_STATUS_${status.toUpperCase()}`, 'Complaint', complaint._id, {
      ticketId: complaint.ticketId,
      status,
    });

    // Notify complainant
    await notify(complaint.raisedBy, {
      title: `Complaint Status Updated: ${complaint.ticketId}`,
      message: `Your maintenance ticket in ${complaint.building} is now: ${status.replace('_', ' ').toUpperCase()}`,
      type: 'complaint',
      link: `/m4/complaints/${complaint._id}`,
      sendEmailAlert: true,
    });

    const io = getIO();
    if (io) {
      io.emit('complaint:updated', { ticketId: complaint.ticketId, status });
    }

    const populated = await Complaint.findById(complaint._id)
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('timeline.by', 'name role');

    res.json({
      success: true,
      data: populated,
      message: `Complaint advanced to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback on resolved ticket (auto-closes ticket)
// @route   POST /api/complaints/:id/feedback
// @access  Private (complainant only)
export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the original complainant can submit feedback for this ticket',
      });
    }

    complaint.feedback = {
      rating: Number(rating),
      comment: comment || '',
    };

    // Auto-advance to closed upon feedback
    complaint.status = 'closed';
    complaint.timeline.push({
      status: 'closed',
      by: req.user._id,
      remark: `Ticket closed with student feedback (${rating}/5 stars): ${comment || 'No comment'}`,
      at: new Date(),
    });

    await complaint.save();

    await logAudit(req, 'COMPLAINT_FEEDBACK', 'Complaint', complaint._id, {
      ticketId: complaint.ticketId,
      rating,
    });

    const io = getIO();
    if (io) {
      io.emit('complaint:updated', { ticketId: complaint.ticketId, status: 'closed' });
    }

    res.json({
      success: true,
      data: complaint,
      message: 'Feedback received! Complaint ticket has been officially closed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complaint analytics summary
// @route   GET /api/complaints/analytics/summary
// @access  Private (admin, maintenance)
export const getComplaintAnalytics = async (req, res, next) => {
  try {
    const [total, resolved, open, escalated, byCategory, byPriority, byStatus] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Complaint.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
      Complaint.countDocuments({ escalated: true }),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const breachRate = total > 0 ? Math.round((escalated / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        total,
        resolved,
        open,
        escalated,
        resolutionRate,
        breachRate,
        byCategory: byCategory.map((c) => ({ name: c._id, count: c.count })),
        byPriority: byPriority.map((p) => ({ name: p._id, count: p.count })),
        byStatus: byStatus.map((s) => ({ name: s._id, count: s.count })),
      },
      message: 'Complaint analytics generated',
    });
  } catch (error) {
    next(error);
  }
};
