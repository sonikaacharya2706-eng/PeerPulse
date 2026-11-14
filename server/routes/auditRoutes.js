import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);

export default router;
