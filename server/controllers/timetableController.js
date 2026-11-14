import Timetable from '../models/Timetable.js';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { getIO } from '../services/socket.js';
import { timeToMinutes } from './classroomController.js';

// Helper: check clash between two time intervals
const isClashing = (startA, endA, startB, endB) => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return sA < eB && sB < eA;
};

// @desc    Get timetable entries with filters
// @route   GET /api/timetable
// @access  Public / Private
export const getTimetables = async (req, res, next) => {
  try {
    const { department, year, section, faculty, classroom, dayOfWeek, status } = req.query;
    const query = {};

    if (department) query.department = department;
    if (year) query.year = Number(year);
    if (section) query.section = section.toUpperCase();
    if (faculty) query.faculty = faculty;
    if (classroom) query.classroom = classroom;
    if (dayOfWeek !== undefined) query.dayOfWeek = Number(dayOfWeek);
    if (status) query.status = status;

    const list = await Timetable.find(query)
      .populate('classroom')
      .populate('faculty', 'name email department')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      data: list,
      message: 'Timetable entries retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's personal timetable (today and weekly)
// @route   GET /api/timetable/my
// @access  Private (student, faculty)
export const getMyTimetable = async (req, res, next) => {
  try {
    const user = req.user;
    const todayDay = new Date().getDay();
    const query = { status: 'active' };

    if (user.role === 'faculty') {
      query.faculty = user._id;
    } else if (user.role === 'student') {
      query.department = user.department;
      if (user.year) query.year = user.year;
    }

    const allMySlots = await Timetable.find(query)
      .populate('classroom')
      .populate('faculty', 'name email department')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const todaySlots = allMySlots.filter((slot) => slot.dayOfWeek === todayDay);

    res.json({
      success: true,
      data: {
        today: todaySlots,
        weekly: allMySlots,
        currentDay: todayDay,
      },
      message: 'Personal schedule retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create timetable entry
// @route   POST /api/timetable
// @access  Private (admin, faculty)
export const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      classroom,
      subject,
      faculty,
      department,
      year,
      section,
      dayOfWeek,
      startTime,
      endTime,
      note,
    } = req.body;

    const assignedFaculty = faculty || req.user._id;

    // Validate times
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // 1. Check classroom clash on the same dayOfWeek (Algorithm B)
    const existingRoomSlots = await Timetable.find({
      classroom,
      dayOfWeek: Number(dayOfWeek),
      status: 'active',
    }).populate('classroom faculty');

    for (const slot of existingRoomSlots) {
      if (isClashing(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Classroom conflict: Room is already booked for '${slot.subject}' with Prof. ${slot.faculty?.name || 'Faculty'} from ${slot.startTime} to ${slot.endTime}`,
        });
      }
    }

    // 2. Check faculty clash: faculty cannot be in two rooms at once (Algorithm B)
    const existingFacultySlots = await Timetable.find({
      faculty: assignedFaculty,
      dayOfWeek: Number(dayOfWeek),
      status: 'active',
    }).populate('classroom');

    for (const slot of existingFacultySlots) {
      if (isClashing(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Faculty conflict: The assigned faculty is already scheduled in Room ${slot.classroom?.roomNo || 'another room'} for '${slot.subject}' from ${slot.startTime} to ${slot.endTime}`,
        });
      }
    }

    const timetable = await Timetable.create({
      classroom,
      subject,
      faculty: assignedFaculty,
      department,
      year: Number(year),
      section: section.toUpperCase(),
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      note: note || '',
      status: 'active',
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('classroom')
      .populate('faculty', 'name email');

    await logAudit(req, 'CREATE_TIMETABLE', 'Timetable', timetable._id, {
      subject,
      classroom,
      dayOfWeek,
      time: `${startTime}-${endTime}`,
    });

    // Realtime update
    const io = getIO();
    if (io) {
      io.emit('room:status-changed', { reason: 'timetable_created', timetable: populated });
    }

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Timetable slot created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update timetable entry
// @route   PUT /api/timetable/:id
// @access  Private (admin, faculty)
export const updateTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Timetable.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found',
      });
    }

    // Role check: faculty can only update their own timetable unless admin
    if (req.user.role === 'faculty' && existing.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own timetable slots',
      });
    }

    const classroom = req.body.classroom || existing.classroom;
    const faculty = req.body.faculty || existing.faculty;
    const dayOfWeek = req.body.dayOfWeek !== undefined ? Number(req.body.dayOfWeek) : existing.dayOfWeek;
    const startTime = req.body.startTime || existing.startTime;
    const endTime = req.body.endTime || existing.endTime;

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Check room clashes excluding current slot
    const roomSlots = await Timetable.find({
      _id: { $ne: id },
      classroom,
      dayOfWeek,
      status: 'active',
    }).populate('faculty');

    for (const slot of roomSlots) {
      if (isClashing(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Classroom conflict: Room is already booked for '${slot.subject}' with Prof. ${slot.faculty?.name || 'Faculty'} (${slot.startTime} - ${slot.endTime})`,
        });
      }
    }

    // Check faculty clashes excluding current slot
    const facultySlots = await Timetable.find({
      _id: { $ne: id },
      faculty,
      dayOfWeek,
      status: 'active',
    }).populate('classroom');

    for (const slot of facultySlots) {
      if (isClashing(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(409).json({
          success: false,
          message: `Faculty conflict: Already assigned to Room ${slot.classroom?.roomNo} for '${slot.subject}' (${slot.startTime} - ${slot.endTime})`,
        });
      }
    }

    const updated = await Timetable.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('classroom')
      .populate('faculty', 'name email');

    await logAudit(req, 'UPDATE_TIMETABLE', 'Timetable', id, req.body);

    const io = getIO();
    if (io) {
      io.emit('room:status-changed', { reason: 'timetable_updated', timetable: updated });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Timetable entry updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete timetable entry
// @route   DELETE /api/timetable/:id
// @access  Private (admin, faculty)
export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await Timetable.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found',
      });
    }

    if (req.user.role === 'faculty' && entry.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own timetable slots',
      });
    }

    await Timetable.findByIdAndDelete(id);

    await logAudit(req, 'DELETE_TIMETABLE', 'Timetable', id, { subject: entry.subject });

    const io = getIO();
    if (io) {
      io.emit('room:status-changed', { reason: 'timetable_deleted', id });
    }

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
