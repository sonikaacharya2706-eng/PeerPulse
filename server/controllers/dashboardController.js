import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Timetable from '../models/Timetable.js';
import RoomBooking from '../models/RoomBooking.js';
import LostFoundItem from '../models/LostFoundItem.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Visitor from '../models/Visitor.js';
import Complaint from '../models/Complaint.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';

// @desc    Role-aware dashboard summary stats & recent items
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    let summary = {};

    // Base counts common to campus
    const [totalClassrooms, activeEventsCount, reportedLostFoundCount] = await Promise.all([
      Classroom.countDocuments({ isActive: true }),
      Event.countDocuments({ isCancelled: false, startAt: { $gte: new Date() } }),
      LostFoundItem.countDocuments({ status: 'reported' }),
    ]);

    if (role === 'admin') {
      const [
        totalUsers,
        pendingBookings,
        openComplaints,
        escalatedComplaints,
        onCampusVisitors,
      ] = await Promise.all([
        User.countDocuments(),
        RoomBooking.countDocuments({ status: 'pending' }),
        Complaint.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
        Complaint.countDocuments({ escalated: true }),
        Visitor.countDocuments({ status: 'checked_in' }),
      ]);

      summary = {
        role,
        stats: {
          totalUsers,
          totalClassrooms,
          activeEvents: activeEventsCount,
          pendingBookings,
          openComplaints,
          escalatedComplaints,
          onCampusVisitors,
          reportedLostFound: reportedLostFoundCount,
        },
      };
    } else if (role === 'faculty') {
      const todayDay = new Date().getDay();
      const [todayClasses, myBookings, myEvents, pendingClaims] = await Promise.all([
        Timetable.find({ faculty: userId, dayOfWeek: todayDay, status: 'active' }).populate('classroom'),
        RoomBooking.find({ requestedBy: userId }).sort({ createdAt: -1 }).limit(5).populate('classroom'),
        Event.find({ organizer: userId, isCancelled: false }).sort({ startAt: 1 }).limit(5),
        Complaint.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
      ]);

      summary = {
        role,
        stats: {
          todayClassesCount: todayClasses.length,
          totalClassrooms,
          activeEvents: activeEventsCount,
          myEventsCount: myEvents.length,
        },
        todayClasses,
        myBookings,
        myEvents,
      };
    } else if (role === 'student') {
      const todayDay = new Date().getDay();
      const [todayClasses, myComplaints, myRegistrations] = await Promise.all([
        Timetable.find({
          department: req.user.department,
          ...(req.user.year && { year: req.user.year }),
          dayOfWeek: todayDay,
          status: 'active',
        }).populate('classroom faculty'),
        Complaint.find({ raisedBy: userId }).sort({ createdAt: -1 }).limit(5),
        EventRegistration.find({ user: userId, status: { $in: ['registered', 'waitlisted'] } })
          .populate('event')
          .limit(5),
      ]);

      summary = {
        role,
        stats: {
          todayClassesCount: todayClasses.length,
          myComplaintsCount: myComplaints.length,
          myRegistrationsCount: myRegistrations.length,
          activeEvents: activeEventsCount,
        },
        todayClasses,
        myComplaints,
        myRegistrations,
      };
    } else if (role === 'security') {
      const [onCampusCount, expectedCount, recentScans, foundItemsGate] = await Promise.all([
        Visitor.countDocuments({ status: 'checked_in' }),
        Visitor.countDocuments({ status: 'expected' }),
        Visitor.find().sort({ updatedAt: -1 }).limit(6).populate('personToMeet'),
        LostFoundItem.find({ type: 'found', status: 'reported' }).limit(5),
      ]);

      summary = {
        role,
        stats: {
          onCampusVisitors: onCampusCount,
          expectedVisitors: expectedCount,
          reportedFoundItems: foundItemsGate.length,
        },
        recentScans,
        foundItemsGate,
      };
    } else if (role === 'maintenance') {
      const [assignedCount, inProgressCount, overdueCount, assignedList] = await Promise.all([
        Complaint.countDocuments({ assignedTo: userId, status: 'assigned' }),
        Complaint.countDocuments({ assignedTo: userId, status: 'in_progress' }),
        Complaint.countDocuments({ assignedTo: userId, escalated: true }),
        Complaint.find({ assignedTo: userId, status: { $in: ['assigned', 'in_progress'] } }).sort({
          slaDueAt: 1,
        }),
      ]);

      summary = {
        role,
        stats: {
          assignedTasks: assignedCount,
          inProgressTasks: inProgressCount,
          overdueTasks: overdueCount,
        },
        assignedList,
      };
    }

    res.json({
      success: true,
      data: summary,
      message: `${role} dashboard summary retrieved`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global campus search across all 5 modules
// @route   GET /api/search?q=
// @access  Private / Public
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({
        success: true,
        data: { classrooms: [], events: [], lostFound: [], complaints: [], timetables: [] },
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [classrooms, events, lostFound, complaints, timetables] = await Promise.all([
      Classroom.find({
        $or: [{ roomNo: regex }, { building: regex }, { facilities: { $in: [regex] } }],
      }).limit(5),
      Event.find({
        isCancelled: false,
        $or: [{ title: regex }, { description: regex }, { venue: regex }],
      }).limit(5),
      LostFoundItem.find({
        $or: [{ title: regex }, { description: regex }, { location: regex }],
      }).limit(5),
      Complaint.find({
        $or: [{ ticketId: regex }, { building: regex }, { room: regex }, { description: regex }],
      }).limit(5),
      Timetable.find({
        $or: [{ subject: regex }, { department: regex }],
      })
        .populate('classroom faculty')
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        query: q,
        classrooms,
        events,
        lostFound,
        complaints,
        timetables,
      },
      message: 'Global search completed',
    });
  } catch (error) {
    next(error);
  }
};
