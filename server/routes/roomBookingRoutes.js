import express from 'express';
import { body } from 'express-validator';
import {
  searchFreeRooms,
  createBooking,
  getBookings,
  decideBooking,
} from '../controllers/roomBookingController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Free room search is protected (security excluded)
router.get('/free-search', protect, authorize('faculty', 'student', 'admin', 'maintenance'), searchFreeRooms);

// Booking routes
router
  .route('/')
  .get(protect, authorize('faculty', 'admin'), getBookings)
  .post(
    protect,
    authorize('faculty', 'admin'),
    [
      body('classroom').notEmpty().withMessage('Classroom ID is required'),
      body('date').notEmpty().withMessage('Booking date is required'),
      body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time format must be HH:mm'),
      body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time format must be HH:mm'),
      body('purpose').trim().notEmpty().withMessage('Purpose is required'),
      body('expectedStrength').isInt({ min: 1 }).withMessage('Expected strength must be at least 1'),
      validate,
    ],
    createBooking
  );

router.patch(
  '/:id/decision',
  protect,
  authorize('admin'),
  [
    body('status').isIn(['approved', 'rejected', 'cancelled']).withMessage('Invalid status decision'),
    validate,
  ],
  decideBooking
);

export default router;
