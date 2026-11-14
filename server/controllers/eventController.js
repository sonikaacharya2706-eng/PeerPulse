import crypto from 'crypto';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { generateQRCodeDataURL } from '../utils/qr.js';
import { saveFileToDB } from '../middleware/upload.js';

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (faculty, admin)
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      startAt,
      endAt,
      capacity,
      registrationDeadline,
      targetDepartments,
      targetYears,
      targetClubs,
    } = req.body;

    const poster = req.file ? await saveFileToDB(req.file, req.user._id) : '';
    const qrSecret = crypto.randomBytes(16).toString('hex');

    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      poster,
      organizer: req.user._id,
      capacity: Number(capacity),
      registrationDeadline: new Date(registrationDeadline),
      targetDepartments: targetDepartments
        ? Array.isArray(targetDepartments)
          ? targetDepartments
          : targetDepartments.split(',').map((d) => d.trim()).filter(Boolean)
        : [],
      targetYears: targetYears
        ? Array.isArray(targetYears)
          ? targetYears.map(Number)
          : targetYears.split(',').map((y) => Number(y.trim())).filter((y) => !isNaN(y))
        : [],
      targetClubs: targetClubs
        ? Array.isArray(targetClubs)
          ? targetClubs
          : targetClubs.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
      qrSecret,
    });

    const populated = await Event.findById(event._id).populate('organizer', 'name email department');

    await logAudit(req, 'CREATE_EVENT', 'Event', event._id, { title, capacity });

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Event created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Public / Private
export const getEvents = async (req, res, next) => {
  try {
    const { category, from, to, mine } = req.query;
    const query = { isCancelled: false };

    if (category) query.category = category;
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }
    if (mine === 'true' && req.user) {
      query.organizer = req.user._id;
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email department')
      .sort({ startAt: 1 });

    // Fetch registration counts for each event
    const enhancedEvents = await Promise.all(
      events.map(async (evt) => {
        const [registeredCount, waitlistedCount] = await Promise.all([
          EventRegistration.countDocuments({ event: evt._id, status: 'registered' }),
          EventRegistration.countDocuments({ event: evt._id, status: 'waitlisted' }),
        ]);

        let userRegistration = null;
        if (req.user) {
          userRegistration = await EventRegistration.findOne({
            event: evt._id,
            user: req.user._id,
          });
        }

        return {
          ...evt.toObject(),
          registeredCount,
          waitlistedCount,
          userRegistration,
        };
      })
    );

    res.json({
      success: true,
      data: enhancedEvents,
      message: 'Events retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event detail
// @route   GET /api/events/:id
// @access  Public / Private
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email department');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const [registeredCount, waitlistedCount] = await Promise.all([
      EventRegistration.countDocuments({ event: event._id, status: 'registered' }),
      EventRegistration.countDocuments({ event: event._id, status: 'waitlisted' }),
    ]);

    let userRegistration = null;
    if (req.user) {
      userRegistration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
      });
    }

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        registeredCount,
        waitlistedCount,
        userRegistration,
      },
      message: 'Event detail retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event (organizer or admin)
// @route   PUT /api/events/:id
// @access  Private (faculty, admin)
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role === 'faculty' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the organizer can modify this event' });
    }

    const updates = { ...req.body };
    if (req.file) updates.poster = await saveFileToDB(req.file, req.user._id);

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('organizer', 'name email');

    await logAudit(req, 'UPDATE_EVENT', 'Event', event._id, updates);

    res.json({
      success: true,
      data: updated,
      message: 'Event updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / Cancel event
// @route   DELETE /api/events/:id
// @access  Private (faculty, admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role === 'faculty' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the organizer can cancel this event' });
    }

    event.isCancelled = true;
    await event.save();

    await logAudit(req, 'CANCEL_EVENT', 'Event', event._id, { title: event.title });

    // Notify registered attendees
    const attendees = await EventRegistration.find({
      event: event._id,
      status: { $in: ['registered', 'waitlisted'] },
    });
    if (attendees.length > 0) {
      await notify(
        attendees.map((a) => a.user),
        {
          title: `Event Cancelled: '${event.title}'`,
          message: `Notice: The event '${event.title}' scheduled for ${new Date(event.startAt).toLocaleDateString()} has been cancelled by the organizer.`,
          type: 'event',
          link: '/m5/events',
          sendEmailAlert: true,
        }
      );
    }

    res.json({
      success: true,
      message: 'Event cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for event (Algorithm I)
// @route   POST /api/events/:id/register
// @access  Private
// Algorithm I:
// If registered count < capacity -> registered, else waitlisted
// Block registration after deadline or for non-targeted audiences
export const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.isCancelled) {
      return res.status(400).json({ success: false, message: 'This event has been cancelled' });
    }

    // 1. Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this event',
      });
    }

    // 2. Check targeted audience constraints
    const user = req.user;
    if (event.targetDepartments && event.targetDepartments.length > 0) {
      if (!user.department || !event.targetDepartments.includes(user.department.toUpperCase())) {
        return res.status(403).json({
          success: false,
          message: `Restricted event: Only students/faculty in ${event.targetDepartments.join(', ')} may register.`,
        });
      }
    }

    if (event.targetYears && event.targetYears.length > 0) {
      if (!user.year || !event.targetYears.includes(user.year)) {
        return res.status(403).json({
          success: false,
          message: `Restricted event: Only Year ${event.targetYears.join(', ')} students may register.`,
        });
      }
    }

    if (event.targetClubs && event.targetClubs.length > 0) {
      const hasMatchingClub = user.clubs?.some((c) => event.targetClubs.includes(c));
      if (!hasMatchingClub) {
        return res.status(403).json({
          success: false,
          message: `Restricted event: Only members of clubs [${event.targetClubs.join(', ')}] may register.`,
        });
      }
    }

    // 3. Check existing registration
    let existingReg = await EventRegistration.findOne({
      event: event._id,
      user: user._id,
    });

    if (existingReg && ['registered', 'waitlisted'].includes(existingReg.status)) {
      return res.status(409).json({
        success: false,
        message: `You are already ${existingReg.status} for this event`,
      });
    }

    // 4. Algorithm I Capacity & Waitlist allocation (Acceptance Test 8)
    const currentRegisteredCount = await EventRegistration.countDocuments({
      event: event._id,
      status: 'registered',
    });

    const status = currentRegisteredCount < event.capacity ? 'registered' : 'waitlisted';

    if (existingReg) {
      existingReg.status = status;
      existingReg.checkedInAt = null;
      await existingReg.save();
    } else {
      existingReg = await EventRegistration.create({
        event: event._id,
        user: user._id,
        status,
      });
    }

    await logAudit(req, `EVENT_${status.toUpperCase()}`, 'EventRegistration', existingReg._id, {
      eventTitle: event.title,
    });

    // Notify user
    await notify(user._id, {
      title: status === 'registered' ? 'Registration Confirmed!' : 'Added to Waitlist',
      message:
        status === 'registered'
          ? `Your seat for '${event.title}' is confirmed. Venue: ${event.venue} on ${new Date(event.startAt).toLocaleString()}`
          : `Event '${event.title}' is currently at full capacity. You are on the waitlist and will be automatically promoted if a seat opens up!`,
      type: 'event',
      link: `/m5/events/${event._id}`,
      sendEmailAlert: true,
    });

    res.status(201).json({
      success: true,
      data: existingReg,
      message:
        status === 'registered'
          ? 'Registration confirmed!'
          : 'Event is full: You have been placed on the priority waitlist.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel event registration (Algorithm I: Auto-promotes waitlist)
// @route   DELETE /api/events/:id/register
// @access  Private
// Algorithm I & Acceptance Test 8:
// When a registered user cancels, promote the oldest waitlisted user automatically and notify them
export const cancelRegistration = async (req, res, next) => {
  try {
    const reg = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id,
    });

    if (!reg || reg.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'No active registration found' });
    }

    const previousStatus = reg.status;
    reg.status = 'cancelled';
    await reg.save();

    const event = await Event.findById(req.params.id);

    // If a confirmed registrant cancelled, promote the oldest waitlisted user (Acceptance Test 8)
    if (previousStatus === 'registered' && event) {
      const oldestWaitlisted = await EventRegistration.findOne({
        event: event._id,
        status: 'waitlisted',
      })
        .sort({ createdAt: 1 })
        .populate('user', 'name email');

      if (oldestWaitlisted) {
        oldestWaitlisted.status = 'registered';
        await oldestWaitlisted.save();

        // Notify the promoted user!
        await notify(oldestWaitlisted.user._id, {
          title: '🎉 Promoted from Waitlist!',
          message: `Great news! A seat opened up for '${event.title}' and your registration has been automatically promoted to CONFIRMED!`,
          type: 'event',
          link: `/m5/events/${event._id}`,
          sendEmailAlert: true,
        });

        console.log(`[Event Algorithm I] Promoted waitlisted user ${oldestWaitlisted.user.name} for ${event.title}`);
      }
    }

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event attendees (organizer only)
// @route   GET /api/events/:id/registrations
// @access  Private (faculty, admin)
export const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registrations = await EventRegistration.find({ event: event._id })
      .populate('user', 'name email phone rollNo department year')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: registrations,
      message: 'Attendees retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in attendee via QR or user ID
// @route   POST /api/events/:id/checkin
// @access  Private (faculty, admin)
export const checkInAttendee = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required for check-in' });
    }

    const registration = await EventRegistration.findOne({
      event: req.params.id,
      user: userId,
    }).populate('user', 'name email rollNo');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No registration record found for this user',
      });
    }

    if (registration.status === 'attended') {
      return res.status(409).json({
        success: false,
        message: `Attendee ${registration.user?.name} has already checked in!`,
      });
    }

    registration.status = 'attended';
    registration.checkedInAt = new Date();
    await registration.save();

    await logAudit(req, 'EVENT_CHECKIN', 'EventRegistration', registration._id, {
      userId,
      eventId: req.params.id,
    });

    res.json({
      success: true,
      data: registration,
      message: `Checked in successfully: ${registration.user?.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get check-in QR code for event
// @route   GET /api/events/:id/qr
// @access  Private (faculty, admin)
export const getEventQR = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const qrPayload = JSON.stringify({
      type: 'event_checkin',
      eventId: event._id,
      token: event.qrSecret,
    });

    const qrDataURL = await generateQRCodeDataURL(qrPayload);

    res.json({
      success: true,
      data: { qrDataURL, eventId: event._id },
      message: 'Event check-in QR generated',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit event attendee feedback
// @route   POST /api/events/:id/feedback
// @access  Private
export const submitEventFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const registration = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'You must be registered for this event to leave feedback',
      });
    }

    registration.feedback = {
      rating: Number(rating),
      comment: comment || '',
    };
    await registration.save();

    res.json({
      success: true,
      data: registration,
      message: 'Thank you for your event feedback!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Event module analytics summary
// @route   GET /api/events/analytics/summary
// @access  Private (faculty, admin)
export const getEventAnalytics = async (req, res, next) => {
  try {
    const [totalEvents, totalRegistrations, totalAttended, byCategory] = await Promise.all([
      Event.countDocuments({ isCancelled: false }),
      EventRegistration.countDocuments({ status: { $in: ['registered', 'attended'] } }),
      EventRegistration.countDocuments({ status: 'attended' }),
      Event.aggregate([
        { $match: { isCancelled: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const attendanceRate =
      totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalEvents,
        totalRegistrations,
        totalAttended,
        attendanceRate,
        byCategory: byCategory.map((c) => ({ name: c._id, count: c.count })),
      },
      message: 'Event analytics generated',
    });
  } catch (error) {
    next(error);
  }
};
