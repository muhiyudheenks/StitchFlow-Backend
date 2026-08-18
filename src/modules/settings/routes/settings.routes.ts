import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import protect from '../../../shared/middleware/authMiddleware';
import { authorize } from '../../../shared/middleware/roleMiddleware';

const settingsRouter = Router();

settingsRouter.get('/', protect, getSettings);
settingsRouter.patch('/', protect, authorize('admin'), updateSettings);

export default settingsRouter;
