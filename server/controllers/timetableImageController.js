import TimetableImage from '../models/TimetableImage.js';
import User from '../models/User.js';
import { saveFileToDB, generateSignedFileUrl } from '../middleware/upload.js';
import { logAudit } from '../middleware/audit.js';
import { notify } from '../services/notificationService.js';

// @desc    Upload a timetable image sheet (Faculty only)
// @route   POST /api/timetable/images
// @access  Private (faculty, admin)
export const uploadTimetableImage = async (req, res, next) => {
  try {
    const { title, department, year, section = 'A', semester = 'Current Semester', description = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Timetable image file is required',
      });
    }

    if (!title || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'Title, department, and year are required',
      });
    }

    // Persist file into MongoDB Buffer storage
    const imageUrl = await saveFileToDB(req.file, req.user._id);

    const timetableImage = await TimetableImage.create({
      title,
      department: department.toUpperCase(),
      year: Number(year),
      section: section.toUpperCase(),
      semester,
      description,
      imageUrl,
      uploadedBy: req.user._id,
    });

    await timetableImage.populate('uploadedBy', 'name email department');
    await logAudit(req, 'UPLOAD_TIMETABLE_IMAGE', 'TimetableImage', timetableImage._id, {
      title,
      department,
      year,
      section,
    });

    // Notify students of this department & year
    const targetStudents = await User.find({
      role: 'student',
      department: department.toUpperCase(),
      year: Number(year),
    }).select('_id');

    if (targetStudents.length > 0) {
      const studentIds = targetStudents.map((s) => s._id);
      await notify(studentIds, {
        title: 'New Class Timetable Sheet Published',
        message: `Prof. ${req.user.name} uploaded a new timetable sheet for ${department.toUpperCase()} Year ${year} (Sec ${section.toUpperCase()}).`,
        type: 'timetable',
        link: '/m1/timetable',
      });
    }

    res.status(201).json({
      success: true,
      data: timetableImage,
      message: 'Timetable sheet image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get uploaded timetable image sheets
// @route   GET /api/timetable/images
// @access  Private (student, faculty, admin)
export const getTimetableImages = async (req, res, next) => {
  try {
    const { department, year, section } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department.toUpperCase();
    if (year) filter.year = Number(year);
    if (section && section !== 'ALL') filter.section = section.toUpperCase();

    // If current user is student and no query specified, default filter to student's class
    if (req.user && req.user.role === 'student' && !department && !year) {
      if (req.user.department) filter.department = req.user.department;
      if (req.user.year) filter.year = req.user.year;
    }

    const images = await TimetableImage.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email department');

    const signedImages = images.map((img) => {
      const obj = img.toObject();
      if (obj.imageUrl && obj.imageUrl.startsWith('/api/files/')) {
        const fileId = obj.imageUrl.split('/api/files/')[1].split('?')[0];
        if (fileId) {
          obj.imageUrl = generateSignedFileUrl(fileId);
        }
      }
      return obj;
    });

    res.json({
      success: true,
      data: signedImages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable image sheet
// @route   DELETE /api/timetable/images/:id
// @access  Private (faculty owner or admin)
export const deleteTimetableImage = async (req, res, next) => {
  try {
    const imageDoc = await TimetableImage.findById(req.params.id);
    if (!imageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Timetable image not found',
      });
    }

    // Role check: only uploader or admin can delete
    if (
      req.user.role !== 'admin' &&
      imageDoc.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete timetable sheets that you uploaded',
      });
    }

    await imageDoc.deleteOne();
    await logAudit(req, 'DELETE_TIMETABLE_IMAGE', 'TimetableImage', imageDoc._id, {
      title: imageDoc.title,
    });

    res.json({
      success: true,
      message: 'Timetable sheet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
