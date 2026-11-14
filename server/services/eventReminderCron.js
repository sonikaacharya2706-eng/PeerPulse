import cron from 'node-cron';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import { notify } from './notificationService.js';

export const checkEventReminders = async () => {
  try {
    const now = new Date();

    // 1. Check 24-hour reminders: startAt between now + 23h and now + 25h
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const events24h = await Event.find({
      isCancelled: false,
      reminded24: false,
      startAt: { $gte: in23h, $lte: in25h },
    });

    for (const evt of events24h) {
      const registrations = await EventRegistration.find({
        event: evt._id,
        status: 'registered',
      }).select('user');

      if (registrations.length > 0) {
        const userIds = registrations.map((r) => r.user);
        await notify(userIds, {
          title: `Reminder: '${evt.title}' starts in 24 hours`,
          message: `Your registered campus event '${evt.title}' is tomorrow at ${new Date(evt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} in ${evt.venue}!`,
          type: 'event',
          link: `/m5/events/${evt._id}`,
          sendEmailAlert: true,
        });
      }

      evt.reminded24 = true;
      await evt.save();
    }

    // 2. Check 1-hour reminders: startAt between now and now + 70m
    const in70m = new Date(now.getTime() + 70 * 60 * 1000);

    const events1h = await Event.find({
      isCancelled: false,
      reminded1: false,
      startAt: { $gte: now, $lte: in70m },
    });

    for (const evt of events1h) {
      const registrations = await EventRegistration.find({
        event: evt._id,
        status: 'registered',
      }).select('user');

      if (registrations.length > 0) {
        const userIds = registrations.map((r) => r.user);
        await notify(userIds, {
          title: `Starting Soon: '${evt.title}' begins in 1 hour!`,
          message: `The event '${evt.title}' starts soon at ${evt.venue}. Please arrive on time with your registration pass.`,
          type: 'event',
          link: `/m5/events/${evt._id}`,
          sendEmailAlert: true,
        });
      }

      evt.reminded1 = true;
      await evt.save();
    }
  } catch (error) {
    console.error('[Event Reminder Cron Error]:', error.message);
  }
};

export const initEventReminderCron = () => {
  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', () => {
    checkEventReminders();
  });
  console.log('[Event Reminder Cron] Event start reminder monitor scheduled (every 5m).');
};
