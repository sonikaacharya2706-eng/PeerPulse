import express from 'express';
import { body } from 'express-validator';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  submitFeedback,
  getComplaintAnalytics,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/analytics/summary', authorize('admin', 'maintenance'), getComplaintAnalytics);

router
  .route('/')
  .get(getComplaints)
  .post(
    authorize('student', 'faculty'),
    upload.array('images', 3),
    [
      body('category')
        .isIn(['electrical', 'plumbing', 'internet', 'furniture', 'cleaning', 'other'])
        .withMessage('Valid category required'),
      body('building').trim().notEmpty().withMessage('Building name required'),
      body('room').trim().notEmpty().withMessage('Room number required'),
      body('description').trim().notEmpty().withMessage('Description required'),
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Valid priority required'),
      validate,
    ],
    createComplaint
  );

router.get('/:id', getComplaintById);

router.patch(
  '/:id/assign',
  authorize('admin'),
  [body('assignedTo').notEmpty().withMessage('Technician user ID is required'), validate],
  assignComplaint
);

router.patch(
  '/:id/status',
  authorize('maintenance', 'admin'),
  upload.array('images', 3),
  [
    body('status')
      .isIn(['assigned', 'in_progress', 'resolved', 'closed'])
      .withMessage('Valid forward status required'),
    validate,
  ],
  updateComplaintStatus
);

router.post(
  '/:id/feedback',
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),
    validate,
  ],
  submitFeedback
);

export default router;
