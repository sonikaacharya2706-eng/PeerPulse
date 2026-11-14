import express from 'express';
import { body } from 'express-validator';
import {
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  getClassroomStatus,
} from '../controllers/classroomController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/status', getClassroomStatus);

router
  .route('/')
  .get(getClassrooms)
  .post(
    protect,
    authorize('admin'),
    [
      body('roomNo').trim().notEmpty().withMessage('Room number is required'),
      body('building').trim().notEmpty().withMessage('Building name is required'),
      body('floor').isNumeric().withMessage('Floor must be a number'),
      body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
      body('type').isIn(['lecture', 'lab', 'seminar']).withMessage('Invalid room type'),
      validate,
    ],
    createClassroom
  );

router
  .route('/:id')
  .put(protect, authorize('admin'), updateClassroom)
  .delete(protect, authorize('admin'), deleteClassroom);

export default router;
