import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

export const logAudit = async (req, action, entity, entityId, meta = {}) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Database not connected (e.g. unit testing or disconnected state)
      return;
    }

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
