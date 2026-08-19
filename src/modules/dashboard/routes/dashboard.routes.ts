import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';

const router = Router();

router.get('/overview', controller.getOverviewCards);
router.get('/production-progress', controller.getProductionProgress);
router.get('/inventory-status', controller.getInventoryStatus);
router.get('/recent-activities', controller.getRecentActivities);
router.get('/analytics-summary', controller.getAnalyticsSummary);
router.get('/', controller.getOverviewCards);

export default router;
