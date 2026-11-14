import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('email').isEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
      body('role')
        .isIn(['admin', 'faculty', 'student', 'security', 'maintenance'])
        .withMessage('Valid role is required'),
      validate,
    ],
    createUser
  );

router
  .route('/:id')
  .put(updateUser)
  .delete(deleteUser);

router.patch('/:id/toggle', toggleUserStatus);

export default router;
