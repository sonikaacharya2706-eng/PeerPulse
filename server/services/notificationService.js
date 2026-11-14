import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from './socket.js';
import { sendEmail } from './emailService.js';

export const notify = async (userIds, { title, message, type, link = '', sendEmailAlert = false }) => {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (!ids || ids.length === 0) return [];

    const notificationsToInsert = ids.map((uid) => ({
      user: uid,
      title,
      message,
      type,
      link,
      isRead: false,
    }));

    const savedNotifications = await Notification.insertMany(notificationsToInsert);
    const io = getIO();

    for (const notif of savedNotifications) {
      if (io) {
        io.to(`user:${notif.user.toString()}`).emit('notification:new', notif);
      }
    }

    if (sendEmailAlert) {
      const users = await User.find({ _id: { $in: ids }, isActive: true }).select('email name');
      for (const u of users) {
        if (u.email) {
          sendEmail({
            to: u.email,
            subject: `[Smart Campus] ${title}`,
            text: `Hello ${u.name},\n\n${message}\n\nView details: ${link || process.env.CLIENT_URL || 'http://localhost:5173'}`,
          }).catch((err) => console.error('[Notification Email Failed]:', err.message));
        }
      }
    }

    return savedNotifications;
  } catch (error) {
    console.error('[NotificationService Error]:', error.message);
    return [];
  }
};
