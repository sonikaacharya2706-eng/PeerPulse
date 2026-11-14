import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';
import { getIO } from '../services/socket.js';
import { generateQRCodeDataURL } from '../utils/qr.js';
import {
  generateQRToken,
  verifyQRToken,
  calculateHaversineDistance,
} from '../services/attendanceCrypto.js';

// @desc    Faculty starts a new attendance session
// @route   POST /api/attendance/sessions
// @access  Private (faculty, admin)
export const startSession = async (req, res, next) => {
  try {
    const { subject, department, year, section, classroom, geo, geoRequired } = req.body;

    const qrSecret = crypto.randomBytes(32).toString('hex');

    const session = await AttendanceSession.create({
      faculty: req.user._id,
      subject,
      department,
      year: Number(year),
      section: section.toUpperCase(),
      classroom,
      startedAt: new Date(),
      isActive: true,
      qrSecret,
      qrRefreshSeconds: 20,
      geo: geo || { lat: null, lng: null, radiusMeters: 50 },
      geoRequired: Boolean(geoRequired),
    });

    const populated = await AttendanceSession.findById(session._id)
      .populate('faculty', 'name email')
      .populate('classroom');

    // Generate initial dynamic token & QR
    const initialToken = generateQRToken(qrSecret, session._id.toString(), 20);
    const qrPayload = JSON.stringify({ sid: session._id, token: initialToken });
    const qrDataURL = await generateQRCodeDataURL(qrPayload);

    await logAudit(req, 'START_ATTENDANCE_SESSION', 'AttendanceSession', session._id, {
      subject,
      department,
      section,
    });

    res.status(201).json({
      success: true,
      data: {
        session: populated,
        qrDataURL,
        token: initialToken,
      },
      message: 'Attendance session started successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Faculty ends an attendance session
// @route   PATCH /api/attendance/sessions/:id/end
// @access  Private (faculty, admin)
export const endSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.user.role === 'faculty' && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to end this session' });
    }

    session.isActive = false;
    session.endsAt = new Date();
    await session.save();

    await logAudit(req, 'END_ATTENDANCE_SESSION', 'AttendanceSession', session._id);

    const io = getIO();
    if (io) {
      io.to(`session:${session._id}`).emit('session:ended', { sessionId: session._id });
    }

    res.json({
      success: true,
      data: session,
      message: 'Attendance session ended',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Poll refreshed dynamic QR code
// @route   GET /api/attendance/sessions/:id/qr
// @access  Private (faculty, admin)
export const getSessionQR = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (!session.isActive) {
      return res.status(400).json({ success: false, message: 'Session has ended' });
    }

    const token = generateQRToken(session.qrSecret, session._id.toString(), session.qrRefreshSeconds);
    const qrPayload = JSON.stringify({ sid: session._id, token });
    const qrDataURL = await generateQRCodeDataURL(qrPayload);

    res.json({
      success: true,
      data: {
        qrDataURL,
        token,
        refreshInSeconds: session.qrRefreshSeconds,
      },
      message: 'QR code refreshed',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live attendee list for faculty
// @route   GET /api/attendance/sessions/:id/live
// @access  Private (faculty, admin)
export const getSessionLive = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('classroom');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'name email rollNo department year')
      .sort({ markedAt: -1 });

    res.json({
      success: true,
      data: {
        session,
        records,
        totalMarked: records.length,
      },
      message: 'Live session data retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student marks attendance via Dynamic QR
// @route   POST /api/attendance/mark
// @access  Private (student)
// Algorithm D: Dynamic QR Verification & Haversine Geofence
export const markAttendance = async (req, res, next) => {
  try {
    const { sid, token, lat, lng } = req.body;
    const student = req.user;

    if (!sid || !token) {
      return res.status(400).json({
        success: false,
        message: 'Session ID (sid) and token are required',
      });
    }

    const session = await AttendanceSession.findById(sid);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found',
      });
    }

    // 1. Session Active check
    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Attendance session is no longer active',
      });
    }

    // 2. Token verification: accepts current or previous window only (Acceptance Test 3)
    const isValidToken = verifyQRToken(
      session.qrSecret,
      session._id.toString(),
      token,
      session.qrRefreshSeconds
    );
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR token. Please scan the current live code.',
      });
    }

    // 3. Check enrollment: student must belong to session's department & year
    if (student.department && session.department && student.department.toUpperCase() !== session.department.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: `Department mismatch: This class is for ${session.department}, but your profile is ${student.department}`,
      });
    }

    if (student.year && session.year && student.year !== session.year) {
      return res.status(403).json({
        success: false,
        message: `Year mismatch: This class is for Year ${session.year}, but your profile is Year ${student.year}`,
      });
    }

    // 4. Geofence check if geoRequired
    if (session.geoRequired && session.geo?.lat && session.geo?.lng) {
      if (lat === undefined || lng === undefined) {
        return res.status(403).json({
          success: false,
          message: 'Location required: Faculty requires physical presence inside classroom',
        });
      }
      const distance = calculateHaversineDistance(
        Number(lat),
        Number(lng),
        session.geo.lat,
        session.geo.lng
      );
      if (distance > (session.geo.radiusMeters || 50)) {
        return res.status(403).json({
          success: false,
          message: `Geofence violation: You are ${Math.round(distance)}m away (max allowed radius is ${session.geo.radiusMeters || 50}m)`,
        });
      }
    }

    // 5. Unique check: reject if already marked (Acceptance Test 3: HTTP 409)
    const existing = await AttendanceRecord.findOne({
      session: session._id,
      student: student._id,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }

    const record = await AttendanceRecord.create({
      session: session._id,
      student: student._id,
      markedAt: new Date(),
      method: 'qr',
      status: 'present',
      geo: { lat: lat || null, lng: lng || null },
    });

    const populatedRecord = await AttendanceRecord.findById(record._id).populate(
      'student',
      'name email rollNo department year'
    );

    // Realtime notification to faculty live view (Acceptance Test 4)
    const io = getIO();
    if (io) {
      io.to(`session:${session._id}`).emit('attendance:marked', populatedRecord);
      io.to(`user:${session.faculty.toString()}`).emit('attendance:marked', populatedRecord);
    }

    // Algorithm E: Compute updated attendance % for this student in this subject
    const allSessions = await AttendanceSession.find({
      subject: session.subject,
      department: session.department,
      year: session.year,
    }).select('_id');

    const totalSessionsCount = allSessions.length;
    if (totalSessionsCount > 0) {
      const presentCount = await AttendanceRecord.countDocuments({
        session: { $in: allSessions.map((s) => s._id) },
        student: student._id,
        status: 'present',
      });

      const percentage = Math.round((presentCount / totalSessionsCount) * 100);

      if (percentage < 75) {
        await notify(student._id, {
          title: 'Low Attendance Warning (< 75%)',
          message: `Your attendance in '${session.subject}' is currently ${percentage}%. You need &ge; 75% to sit for end-semester exams!`,
          type: 'attendance',
          link: '/m3/student/my-attendance',
          sendEmailAlert: true,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: populatedRecord,
      message: 'Attendance recorded successfully: Present',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }
    next(error);
  }
};

// @desc    Faculty manually marks attendance for a student
// @route   POST /api/attendance/manual
// @access  Private (faculty, admin)
export const manualAttendance = async (req, res, next) => {
  try {
    const { sessionId, studentId, status } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    let record = await AttendanceRecord.findOne({ session: sessionId, student: studentId });

    if (record) {
      record.status = status || 'present';
      record.method = 'manual';
      record.markedAt = new Date();
      await record.save();
    } else {
      record = await AttendanceRecord.create({
        session: sessionId,
        student: studentId,
        status: status || 'present',
        method: 'manual',
        markedAt: new Date(),
      });
    }

    const populated = await AttendanceRecord.findById(record._id).populate(
      'student',
      'name email rollNo department year'
    );

    const io = getIO();
    if (io) {
      io.to(`session:${session._id}`).emit('attendance:marked', populated);
    }

    res.json({
      success: true,
      data: populated,
      message: `Student marked as ${record.status} manually`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's own attendance summary (Algorithm E)
// @route   GET /api/attendance/my-summary
// @access  Private (student, faculty)
export const getMySummary = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Find all sessions held for the student's department & year
    const sessions = await AttendanceSession.find({
      department: req.user.department,
      ...(req.user.year && { year: req.user.year }),
    }).populate('faculty', 'name');

    // Group sessions by subject
    const subjectMap = {};
    sessions.forEach((s) => {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = {
          subject: s.subject,
          faculty: s.faculty?.name || 'Prof. Faculty',
          totalSessions: 0,
          sessionIds: [],
        };
      }
      subjectMap[s.subject].totalSessions += 1;
      subjectMap[s.subject].sessionIds.push(s._id);
    });

    // For each subject, count student records
    const summary = [];
    for (const subKey of Object.keys(subjectMap)) {
      const item = subjectMap[subKey];
      const records = await AttendanceRecord.find({
        session: { $in: item.sessionIds },
        student: studentId,
      });

      const presentCount = records.filter((r) => r.status === 'present').length;
      const lateCount = records.filter((r) => r.status === 'late').length;
      const percentage = item.totalSessions > 0 ? Math.round((presentCount / item.totalSessions) * 100) : 100;

      summary.push({
        subject: item.subject,
        faculty: item.faculty,
        totalSessions: item.totalSessions,
        attended: presentCount,
        late: lateCount,
        absent: item.totalSessions - presentCount,
        percentage,
        isLow: percentage < 75,
      });
    }

    res.json({
      success: true,
      data: summary,
      message: 'Attendance summary retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance reports (json, csv, or pdf)
// @route   GET /api/attendance/report
// @access  Private (faculty, admin)
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { subject, department, from, to, format: exportFormat = 'json' } = req.query;

    const sessionQuery = {};
    if (subject) sessionQuery.subject = subject;
    if (department) sessionQuery.department = department;

    if (from || to) {
      sessionQuery.startedAt = {};
      if (from) sessionQuery.startedAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        sessionQuery.startedAt.$lte = toDate;
      }
    }

    const sessions = await AttendanceSession.find(sessionQuery).populate('classroom faculty');
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({ session: { $in: sessionIds } })
      .populate('session', 'subject department year section startedAt')
      .populate('student', 'name email rollNo department year')
      .sort({ markedAt: -1 });

    // Format = CSV
    if (exportFormat === 'csv') {
      const csvData = records.map((r) => ({
        Date: r.session?.startedAt ? new Date(r.session.startedAt).toLocaleDateString() : '',
        Subject: r.session?.subject || '',
        StudentName: r.student?.name || '',
        RollNumber: r.student?.rollNo || '',
        Department: r.student?.department || '',
        Year: r.student?.year || '',
        Status: r.status,
        Method: r.method,
        MarkedAt: new Date(r.markedAt).toLocaleTimeString(),
      }));

      const parser = new Parser({
        fields: ['Date', 'Subject', 'StudentName', 'RollNumber', 'Department', 'Year', 'Status', 'Method', 'MarkedAt'],
      });
      const csv = parser.parse(csvData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`attendance_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    // Format = PDF (using pdfkit)
    if (exportFormat === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${Date.now()}.pdf"`);
      doc.pipe(res);

      doc.fontSize(18).text('Smart Campus Solutions - Attendance Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666666').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      doc.fillColor('#000000').fontSize(11).text(`Subject Filter: ${subject || 'All Subjects'} | Total Records: ${records.length}`);
      doc.moveDown(1);

      // Table Header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 40, doc.y, { width: 70 });
      doc.text('Roll No', 115, doc.y - 12, { width: 70 });
      doc.text('Student Name', 190, doc.y - 12, { width: 140 });
      doc.text('Subject', 335, doc.y - 12, { width: 100 });
      doc.text('Status', 440, doc.y - 12, { width: 60 });
      doc.text('Method', 505, doc.y - 12, { width: 60 });
      doc.moveDown(0.5);
      doc.font('Helvetica');

      records.slice(0, 150).forEach((r) => {
        const y = doc.y;
        if (y > 720) doc.addPage();
        doc.fontSize(8);
        doc.text(r.session?.startedAt ? new Date(r.session.startedAt).toLocaleDateString() : '', 40, doc.y, { width: 70 });
        doc.text(r.student?.rollNo || 'N/A', 115, doc.y - 10, { width: 70 });
        doc.text(r.student?.name || 'N/A', 190, doc.y - 10, { width: 140 });
        doc.text(r.session?.subject || 'N/A', 335, doc.y - 10, { width: 100 });
        doc.text(r.status?.toUpperCase() || 'PRESENT', 440, doc.y - 10, { width: 60 });
        doc.text(r.method || 'qr', 505, doc.y - 10, { width: 60 });
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }

    res.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        totalRecords: records.length,
        records,
      },
      message: 'Attendance report generated',
    });
  } catch (error) {
    next(error);
  }
};
