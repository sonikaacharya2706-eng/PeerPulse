import AuditLog from '../models/AuditLog.js';

export const logAudit = async (req, action, entity, entityId, meta = {}) => {
  try {
    const ip =
      req?.headers['x-forwarded-for']?.split(',')[0] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '';

    const actor = req?.user?._id || null;

    await AuditLog.create({
      actor,
      action,
      entity,
      entityId,
      meta,
      ip,
    });
  } catch (error) {
    console.error('[AuditLog Error]:', error.message);
  }
};
