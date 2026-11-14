import express from 'express';
import { body } from 'express-validator';
import {
  getTimetables,
  getMyTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '../controllers/timetableController.js';
import {
  uploadTimetableImage,
  getTimetableImages,
  deleteTimetableImage,
} from '../controllers/timetableImageController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Timetable Image Sheet upload & view routes
router.post(
  '/images',
  protect,
  authorize('faculty', 'admin'),
  upload.single('image'),
  uploadTimetableImage
);
router.get(
  '/images',
  protect,
  authorize('faculty', 'student', 'admin'),
  getTimetableImages
);
router.delete(
  '/images/:id',
  protect,
  authorize('faculty', 'admin'),
  deleteTimetableImage
);

router.get('/my', protect, getMyTimetable);

router
  .route('/')
  .get(protect, authorize('faculty', 'student', 'admin'), getTimetables)
  .post(
    protect,
    authorize('admin', 'faculty'),
    [
      body('classroom').notEmpty().withMessage('Classroom ID is required'),
      body('subject').trim().notEmpty().withMessage('Subject is required'),
      body('department').trim().notEmpty().withMessage('Department is required'),
      body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
      body('section').trim().notEmpty().withMessage('Section is required'),
      body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
      body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time format must be HH:mm'),
      body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time format must be HH:mm'),
      validate,
    ],
    createTimetableEntry
  );

router
  .route('/:id')
  .put(protect, authorize('admin', 'faculty'), updateTimetableEntry)
  .delete(protect, authorize('admin', 'faculty'), deleteTimetableEntry);

export default router;
