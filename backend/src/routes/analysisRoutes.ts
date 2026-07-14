import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  createAnalysisSchema,
  getAnalysesQuerySchema,
} from '../validations/schemas';
import {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
  generateReport,
  getReportUrl,
} from '../controllers/analysisController';

const router = Router();

// Apply auth requirements to all analyses routes
router.use(requireAuth);

router.post('/', validateRequest(createAnalysisSchema), createAnalysis);
router.get('/', validateRequest(getAnalysesQuerySchema), getAnalyses);
router.get('/:analysisId', getAnalysisById);
router.delete('/:analysisId', deleteAnalysis);

router.post('/:analysisId/report', generateReport);
router.get('/:analysisId/report', getReportUrl);

export default router;
