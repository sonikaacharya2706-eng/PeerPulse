import Classroom from '../models/Classroom.js';
import Timetable from '../models/Timetable.js';
import RoomBooking from '../models/RoomBooking.js';
import { logAudit } from '../middleware/audit.js';

// Helper: convert "HH:mm" to minutes since midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private / Public
export const getClassrooms = async (req, res, next) => {
  try {
    const { building, type, activeOnly } = req.query;
    const query = {};
    if (building) query.building = building;
    if (type) query.type = type;
    if (activeOnly === 'true' || activeOnly === undefined) query.isActive = true;

    const classrooms = await Classroom.find(query).sort({ roomNo: 1 });
    res.json({
      success: true,
      data: classrooms,
      message: 'Classrooms retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create classroom (admin)
// @route   POST /api/classrooms
// @access  Private (admin)
export const createClassroom = async (req, res, next) => {
  try {
    const { roomNo, building, floor, capacity, type, facilities, isActive } = req.body;

    const existing = await Classroom.findOne({ roomNo: roomNo.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Classroom '${roomNo}' already exists`,
      });
    }

    const classroom = await Classroom.create({
      roomNo: roomNo.toUpperCase().trim(),
      building,
      floor: Number(floor),
      capacity: Number(capacity),
      type,
      facilities: facilities || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    await logAudit(req, 'CREATE_CLASSROOM', 'Classroom', classroom._id, { roomNo: classroom.roomNo });

    res.status(201).json({
      success: true,
      data: classroom,
      message: 'Classroom created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update classroom (admin)
// @route   PUT /api/classrooms/:id
// @access  Private (admin)
export const updateClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.roomNo) updates.roomNo = updates.roomNo.toUpperCase().trim();

    const classroom = await Classroom.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    await logAudit(req, 'UPDATE_CLASSROOM', 'Classroom', classroom._id, updates);

    res.json({
      success: true,
      data: classroom,
      message: 'Classroom updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete classroom (admin)
// @route   DELETE /api/classrooms/:id
// @access  Private (admin)
export const deleteClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findByIdAndDelete(id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    await logAudit(req, 'DELETE_CLASSROOM', 'Classroom', id, { roomNo: classroom.roomNo });

    res.json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live status of all classrooms
// @route   GET /api/classrooms/status?time=
// @access  Public / Private
// Algorithm A: Room status (M1)
export const getClassroomStatus = async (req, res, next) => {
  try {
    const classrooms = await Classroom.find({ isActive: true }).sort({ roomNo: 1 });

    const now = new Date();
    // Allow overriding time for simulation e.g. "10:30"
    let currentDay = now.getDay(); // 0-6
    let currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    if (req.query.time) {
      currentTimeMinutes = timeToMinutes(req.query.time);
    }
    if (req.query.day !== undefined) {
      currentDay = Number(req.query.day);
    }

    // Date string for today YYYY-MM-DD
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch active timetable for today
    const timetablesToday = await Timetable.find({
      dayOfWeek: currentDay,
      status: 'active',
    })
      .populate('faculty', 'name email')
      .populate('classroom');

    // Fetch approved bookings for today
    const bookingsToday = await RoomBooking.find({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: 'approved',
    })
      .populate('requestedBy', 'name email')
      .populate('classroom');

    const result = classrooms.map((room) => {
      const roomTimetables = timetablesToday
        .filter((t) => t.classroom && t.classroom._id.toString() === room._id.toString())
        .map((t) => ({
          subject: t.subject,
          faculty: t.faculty?.name || 'Faculty',
          department: t.department,
          year: t.year,
          section: t.section,
          startTime: t.startTime,
          endTime: t.endTime,
          startMins: timeToMinutes(t.startTime),
          endMins: timeToMinutes(t.endTime),
          type: 'Class',
        }));

      const roomBookings = bookingsToday
        .filter((b) => b.classroom && b.classroom._id.toString() === room._id.toString())
        .map((b) => ({
          subject: b.purpose,
          faculty: b.requestedBy?.name || 'Faculty',
          department: '',
          year: '',
          section: '',
          startTime: b.startTime,
          endTime: b.endTime,
          startMins: timeToMinutes(b.startTime),
          endMins: timeToMinutes(b.endTime),
          type: 'Booking',
        }));

      const allSlots = [...roomTimetables, ...roomBookings].sort(
        (a, b) => a.startMins - b.startMins
      );

      // Check current slot
      const currentSlot = allSlots.find(
        (slot) => currentTimeMinutes >= slot.startMins && currentTimeMinutes < slot.endMins
      );

      // Check upcoming slots later than current time
      const upcomingSlots = allSlots.filter((slot) => slot.startMins > currentTimeMinutes);
      const nextSlot = upcomingSlots.length > 0 ? upcomingSlots[0] : null;

      let status = 'Available';
      let freeUntil = null;
      let nextClass = null;

      if (currentSlot) {
        status = 'Occupied';
        freeUntil = currentSlot.endTime;
        nextClass = {
          subject: currentSlot.subject,
          faculty: currentSlot.faculty,
          time: `${currentSlot.startTime} - ${currentSlot.endTime}`,
          type: currentSlot.type,
        };
      } else if (nextSlot) {
        const diffMinutes = nextSlot.startMins - currentTimeMinutes;
        if (diffMinutes <= 30) {
          status = 'Upcoming';
        } else {
          status = 'Available';
        }
        freeUntil = nextSlot.startTime;
        nextClass = {
          subject: nextSlot.subject,
          faculty: nextSlot.faculty,
          time: `${nextSlot.startTime} - ${nextSlot.endTime}`,
          type: nextSlot.type,
          startsInMinutes: diffMinutes,
        };
      } else {
        status = 'Available';
        freeUntil = 'End of Day';
        nextClass = null;
      }

      return {
        _id: room._id,
        roomNo: room.roomNo,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        type: room.type,
        facilities: room.facilities,
        status,
        freeUntil,
        nextClass,
        currentSlot: currentSlot
          ? {
              subject: currentSlot.subject,
              faculty: currentSlot.faculty,
              time: `${currentSlot.startTime} - ${currentSlot.endTime}`,
            }
          : null,
      };
    });

    res.json({
      success: true,
      data: result,
      meta: {
        queriedTime: req.query.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        day: currentDay,
      },
      message: 'Classroom status retrieved',
    });
  } catch (error) {
    next(error);
  }
};
