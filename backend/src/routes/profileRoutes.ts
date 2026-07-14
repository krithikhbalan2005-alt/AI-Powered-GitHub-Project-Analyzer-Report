import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { updateProfileSchema } from '../validations/schemas';
import { getProfile, updateProfile } from '../controllers/profileController';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', validateRequest(updateProfileSchema), updateProfile);

export default router;
