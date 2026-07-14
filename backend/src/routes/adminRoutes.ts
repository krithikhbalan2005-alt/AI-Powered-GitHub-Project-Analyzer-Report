import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getAdminAnalytics, getAdminAnalyses } from '../controllers/adminController';

const router = Router();

// Apply auth and admin requirements to all admin endpoints
router.use(requireAuth, requireAdmin);

router.get('/analytics', getAdminAnalytics);
router.get('/analyses', getAdminAnalyses);

export default router;
