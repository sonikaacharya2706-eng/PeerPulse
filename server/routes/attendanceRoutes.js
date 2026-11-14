import express from 'express';
import { body } from 'express-validator';
import {
  startSession,
  endSession,
  getSessionQR,
  getSessionLive,
  markAttendance,
  manualAttendance,
  getMySummary,
  getAttendanceReport,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

// Faculty session management
router.post(
  '/sessions',
  authorize('faculty', 'admin'),
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('classroom').notEmpty().withMessage('Classroom ID is required'),
    validate,
  ],
  startSession
);

router.patch('/sessions/:id/end', authorize('faculty', 'admin'), endSession);
router.get('/sessions/:id/qr', authorize('faculty', 'admin'), getSessionQR);
router.get('/sessions/:id/live', authorize('faculty', 'admin'), getSessionLive);

// Student marking
router.post(
  '/mark',
  authorize('student'),
  [
    body('sid').notEmpty().withMessage('Session ID is required'),
    body('token').notEmpty().withMessage('QR Token is required'),
    validate,
  ],
  markAttendance
);

// Manual attendance adjustment
router.post(
  '/manual',
  authorize('faculty', 'admin'),
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    validate,
  ],
  manualAttendance
);

// Summaries & Reports
router.get('/my-summary', getMySummary);
router.get('/report', authorize('faculty', 'admin'), getAttendanceReport);

export default router;
