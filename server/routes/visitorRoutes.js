import express from 'express';
import { body } from 'express-validator';
import {
  registerVisitor,
  getVisitors,
  scanVisitorPass,
  getOnCampusVisitors,
  getVisitorPassQR,
} from '../controllers/visitorController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getVisitors)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Visitor name is required'),
      body('phone').trim().notEmpty().withMessage('Phone number is required'),
      body('purpose').trim().notEmpty().withMessage('Purpose of visit is required'),
      body('personToMeet').notEmpty().withMessage('Host person reference is required'),
      validate,
    ],
    registerVisitor
  );

router.post(
  '/scan',
  authorize('security', 'admin'),
  [body('passCode').trim().notEmpty().withMessage('Passcode is required'), validate],
  scanVisitorPass
);

router.get('/on-campus', getOnCampusVisitors);
router.get('/:id/pass', getVisitorPassQR);

export default router;
