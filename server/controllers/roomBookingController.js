import RoomBooking from '../models/RoomBooking.js';
import Classroom from '../models/Classroom.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { getIO } from '../services/socket.js';
import { timeToMinutes } from './classroomController.js';

// Helper: check clash
const isClashing = (startA, endA, startB, endB) => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return sA < eB && sB < eA;
};

// @desc    Search available rooms (Algorithm C)
// @route   GET /api/rooms/free-search
// @access  Public / Private
export const searchFreeRooms = async (req, res, next) => {
  try {
    const { date, startTime, endTime, minCapacity, type, facilities } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'date, startTime, and endTime are required query parameters',
      });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    const startOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    const endOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), 23, 59, 59, 999);

    // Build room filters
    const roomQuery = { isActive: true };
    if (minCapacity) roomQuery.capacity = { $gte: Number(minCapacity) };
    if (type) roomQuery.type = type;
    if (facilities) {
      const facArray = Array.isArray(facilities) ? facilities : facilities.split(',').map((f) => f.trim());
      if (facArray.length > 0) roomQuery.facilities = { $all: facArray };
    }

    const candidateRooms = await Classroom.find(roomQuery);

    // Fetch conflicting active timetable slots for this dayOfWeek
    const timetables = await Timetable.find({
      dayOfWeek,
      status: 'active',
    });

    // Fetch conflicting approved bookings for this date
    const bookings = await RoomBooking.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'approved',
    });

    // Filter candidate rooms having NO clashes
    const freeRooms = candidateRooms.filter((room) => {
      const roomIdStr = room._id.toString();

      // Check timetable clashes
      const hasTimetableClash = timetables.some(
        (t) => t.classroom.toString() === roomIdStr && isClashing(startTime, endTime, t.startTime, t.endTime)
      );
      if (hasTimetableClash) return false;

      // Check approved bookings clash
      const hasBookingClash = bookings.some(
        (b) => b.classroom.toString() === roomIdStr && isClashing(startTime, endTime, b.startTime, b.endTime)
      );
      if (hasBookingClash) return false;

      return true;
    });

    // Sort by smallest sufficient capacity (Algorithm C)
    freeRooms.sort((a, b) => a.capacity - b.capacity);

    res.json({
      success: true,
      data: freeRooms,
      meta: {
        totalFree: freeRooms.length,
        searchedDate: date,
        timeWindow: `${startTime} - ${endTime}`,
      },
      message: 'Available rooms found',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a room booking (faculty)
// @route   POST /api/bookings
// @access  Private (faculty, admin)
export const createBooking = async (req, res, next) => {
  try {
    const { classroom, date, startTime, endTime, purpose, expectedStrength } = req.body;

    if (!classroom || !date || !startTime || !endTime || !purpose || !expectedStrength) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    const startOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    const endOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), 23, 59, 59, 999);

    // 1. Clash with active timetable on the same dayOfWeek (Algorithm B)
    const clashingTimetable = await Timetable.findOne({
      classroom,
      dayOfWeek,
      status: 'active',
    }).populate('classroom faculty');

    if (clashingTimetable && isClashing(startTime, endTime, clashingTimetable.startTime, clashingTimetable.endTime)) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Room ${clashingTimetable.classroom?.roomNo} is already occupied by Timetable class '${clashingTimetable.subject}' (${clashingTimetable.startTime} - ${clashingTimetable.endTime})`,
      });
    }

    // 2. Clash with approved booking on this date (Algorithm B)
    const existingBookings = await RoomBooking.find({
      classroom,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'approved',
    }).populate('classroom requestedBy');

    for (const b of existingBookings) {
      if (isClashing(startTime, endTime, b.startTime, b.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Conflict: Room is already booked for '${b.purpose}' by ${b.requestedBy?.name || 'Faculty'} (${b.startTime} - ${b.endTime})`,
        });
      }
    }

    // 3. Faculty clash: faculty cannot be in two rooms at once (Algorithm B)
    const facultyTimetable = await Timetable.find({
      faculty: req.user._id,
      dayOfWeek,
      status: 'active',
    }).populate('classroom');

    for (const t of facultyTimetable) {
      if (isClashing(startTime, endTime, t.startTime, t.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Conflict: You already have a lecture scheduled in Room ${t.classroom?.roomNo} for '${t.subject}' (${t.startTime} - ${t.endTime})`,
        });
      }
    }

    const facultyBookings = await RoomBooking.find({
      requestedBy: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'approved',
    }).populate('classroom');

    for (const b of facultyBookings) {
      if (isClashing(startTime, endTime, b.startTime, b.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Conflict: You already have an approved booking for Room ${b.classroom?.roomNo} (${b.startTime} - ${b.endTime})`,
        });
      }
    }

    // Create booking
    const booking = await RoomBooking.create({
      classroom,
      requestedBy: req.user._id,
      date: bookingDate,
      startTime,
      endTime,
      purpose,
      expectedStrength: Number(expectedStrength),
      status: req.user.role === 'admin' ? 'approved' : 'pending',
    });

    const populated = await RoomBooking.findById(booking._id)
      .populate('classroom')
      .populate('requestedBy', 'name email department');

    await logAudit(req, 'CREATE_BOOKING', 'RoomBooking', booking._id, {
      classroom,
      purpose,
      date,
      time: `${startTime}-${endTime}`,
    });

    // Notify admins if pending
    if (booking.status === 'pending') {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      await notify(
        admins.map((a) => a._id),
        {
          title: 'New Room Booking Request',
          message: `${req.user.name} requested Room ${populated.classroom?.roomNo} for '${purpose}' on ${date} (${startTime}-${endTime})`,
          type: 'room',
          link: '/m1/bookings',
        }
      );
    }

    const io = getIO();
    if (io) {
      io.emit('room:status-changed', { reason: 'booking_created', booking: populated });
    }

    res.status(201).json({
      success: true,
      data: populated,
      message:
        booking.status === 'approved'
          ? 'Room booked and approved immediately (Admin)'
          : 'Room booking request submitted for admin approval',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings (own for faculty, all for admin)
// @route   GET /api/bookings
// @access  Private (faculty, admin)
export const getBookings = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const query = {};

    if (req.user.role === 'faculty') {
      query.requestedBy = req.user._id;
    }
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const bookings = await RoomBooking.find(query)
      .populate('classroom')
      .populate('requestedBy', 'name email department phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin decision on booking (approve/reject)
// @route   PATCH /api/bookings/:id/decision
// @access  Private (admin)
export const decideBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved', 'rejected', or 'cancelled'",
      });
    }

    const booking = await RoomBooking.findById(id).populate('classroom requestedBy');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // If approving, re-verify clash detection to avoid race conditions
    if (status === 'approved') {
      const bookingDate = new Date(booking.date);
      const dayOfWeek = bookingDate.getDay();
      const startOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
      const endOfDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), 23, 59, 59, 999);

      // Check timetable clash
      const clashingTt = await Timetable.findOne({
        classroom: booking.classroom._id,
        dayOfWeek,
        status: 'active',
      }).populate('classroom');

      if (clashingTt && isClashing(booking.startTime, booking.endTime, clashingTt.startTime, clashingTt.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Cannot approve: Room ${clashingTt.classroom?.roomNo} clashes with active Timetable slot (${clashingTt.startTime} - ${clashingTt.endTime})`,
        });
      }

      // Check existing approved booking clash
      const existingApproved = await RoomBooking.findOne({
        _id: { $ne: booking._id },
        classroom: booking.classroom._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: 'approved',
      });

      if (existingApproved && isClashing(booking.startTime, booking.endTime, existingApproved.startTime, existingApproved.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Cannot approve: Room is already booked for another approved event (${existingApproved.startTime} - ${existingApproved.endTime})`,
        });
      }
    }

    booking.status = status;
    if (adminRemark !== undefined) booking.adminRemark = adminRemark;
    await booking.save();

    await logAudit(req, `BOOKING_${status.toUpperCase()}`, 'RoomBooking', booking._id, {
      status,
      adminRemark,
    });

    // Notify the requester
    await notify(booking.requestedBy._id, {
      title: `Room Booking ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your booking for Room ${booking.classroom?.roomNo} on ${new Date(booking.date).toLocaleDateString()} (${booking.startTime}-${booking.endTime}) was ${status}. Remark: ${adminRemark || 'None'}`,
      type: 'room',
      link: '/m1/bookings',
      sendEmailAlert: true,
    });

    // Broadcast room status change
    const io = getIO();
    if (io) {
      io.emit('room:status-changed', { reason: `booking_${status}`, booking });
    }

    res.json({
      success: true,
      data: booking,
      message: `Booking has been ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
