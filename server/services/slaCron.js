import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { notify } from './notificationService.js';
import { getIO } from './socket.js';

export const calculateSlaDueAt = (priority, fromDate = new Date()) => {
  const date = new Date(fromDate);
  const hoursMap = {
    critical: 4,
    high: 24,
    medium: 72,
    low: 120,
  };
  const hours = hoursMap[priority] || 72;
  date.setHours(date.getHours() + hours);
  return date;
};

export const checkSlaBreaches = async () => {
  try {
    const now = new Date();
    // Overdue tickets not resolved or closed and not yet escalated
    const overdueTickets = await Complaint.find({
      status: { $nin: ['resolved', 'closed'] },
      slaDueAt: { $lt: now },
      escalated: false,
    }).populate('assignedTo raisedBy');

    if (overdueTickets.length === 0) return;

    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const adminIds = admins.map((a) => a._id);

    for (const ticket of overdueTickets) {
      ticket.escalated = true;
      ticket.timeline.push({
        status: ticket.status,
        remark: `SYSTEM SLA BREACH: Ticket exceeded ${ticket.priority} priority SLA deadline. Auto-escalated to Administration.`,
        at: now,
      });

      await ticket.save();

      // Notify admins
      await notify(adminIds, {
        title: `🚨 SLA Escalation Alert: ${ticket.ticketId}`,
        message: `Complaint ${ticket.ticketId} (${ticket.category} in ${ticket.building} ${ticket.room}) has breached its SLA of ${ticket.priority} priority!`,
        type: 'complaint',
        link: `/m4/complaints/${ticket._id}`,
        sendEmailAlert: true,
      });

      // Broadcast update
      const io = getIO();
      if (io) {
        io.emit('complaint:updated', { ticketId: ticket.ticketId, escalated: true });
      }
    }

    console.log(`[SLA Cron] Checked overdue complaints: ${overdueTickets.length} ticket(s) escalated.`);
  } catch (error) {
    console.error('[SLA Cron Error]:', error.message);
  }
};

export const initSlaCron = () => {
  // Run every 15 minutes: */15 * * * *
  cron.schedule('*/15 * * * *', () => {
    checkSlaBreaches();
  });
  console.log('[SLA Cron] Maintenance Complaint SLA monitor scheduled (every 15m).');
};
