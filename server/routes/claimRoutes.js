import express from 'express';
import { body } from 'express-validator';
import { getClaims, decideClaim } from '../controllers/lostFoundController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getClaims);

router.patch(
  '/:id/decision',
  authorize('admin', 'security'),
  [
    body('status').isIn(['approved', 'rejected']).withMessage("Status must be 'approved' or 'rejected'"),
    validate,
  ],
  decideClaim
);

export default router;
