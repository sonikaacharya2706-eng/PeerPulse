import express from 'express';
import { body } from 'express-validator';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  checkInAttendee,
  getEventQR,
  submitEventFeedback,
  getEventAnalytics,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/analytics/summary', protect, authorize('faculty', 'admin'), getEventAnalytics);

router
  .route('/')
  .get(getEvents)
  .post(
    protect,
    authorize('faculty', 'admin'),
    upload.single('poster'),
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('category')
        .isIn(['academic', 'cultural', 'sports', 'technical', 'workshop', 'club', 'other'])
        .withMessage('Valid category required'),
      body('venue').trim().notEmpty().withMessage('Venue is required'),
      body('startAt').notEmpty().withMessage('Start time is required'),
      body('endAt').notEmpty().withMessage('End time is required'),
      body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
      body('registrationDeadline').notEmpty().withMessage('Deadline is required'),
      validate,
    ],
    createEvent
  );

router
  .route('/:id')
  .get(getEventById)
  .put(protect, authorize('faculty', 'admin'), upload.single('poster'), updateEvent)
  .delete(protect, authorize('faculty', 'admin'), deleteEvent);

router
  .route('/:id/register')
  .post(protect, registerForEvent)
  .delete(protect, cancelRegistration);

router.get('/:id/registrations', protect, authorize('faculty', 'admin'), getEventRegistrations);
router.post('/:id/checkin', protect, authorize('faculty', 'admin'), checkInAttendee);
router.get('/:id/qr', protect, authorize('faculty', 'admin'), getEventQR);
router.post(
  '/:id/feedback',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    validate,
  ],
  submitEventFeedback
);

export default router;
