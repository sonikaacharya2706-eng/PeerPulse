import express from 'express';
import { body } from 'express-validator';
import {
  createItem,
  getItems,
  getItemById,
  getSuggestedMatches,
  confirmMatch,
  createClaim,
} from '../controllers/lostFoundController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router
  .route('/')
  .get(getItems)
  .post(
    protect,
    upload.array('images', 3),
    [
      body('type').isIn(['lost', 'found']).withMessage("Type must be 'lost' or 'found'"),
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('category')
        .isIn(['electronics', 'books', 'id_cards', 'clothing', 'accessories', 'keys', 'bags', 'other'])
        .withMessage('Valid category is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('dateOccurred').notEmpty().withMessage('Date is required'),
      body('location').trim().notEmpty().withMessage('Location is required'),
      validate,
    ],
    createItem
  );

router.get('/:id', getItemById);
router.get('/:id/matches', protect, getSuggestedMatches);
router.post('/:id/confirm-match', protect, confirmMatch);

router.post(
  '/:id/claims',
  protect,
  upload.array('proofImages', 3),
  [
    body('proofDescription').trim().notEmpty().withMessage('Proof description is required'),
    validate,
  ],
  createClaim
);

export default router;
