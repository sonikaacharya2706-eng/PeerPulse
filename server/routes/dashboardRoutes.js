import express from 'express';
import { getDashboardSummary, globalSearch } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/search', protect, globalSearch);

export default router;
