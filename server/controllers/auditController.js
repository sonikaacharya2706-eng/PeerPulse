import AuditLog from '../models/AuditLog.js';

// @desc    Get audit logs (admin)
// @route   GET /api/audit-logs
// @access  Private (admin)
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 25 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      message: 'Audit logs retrieved',
    });
  } catch (error) {
    next(error);
  }
};
