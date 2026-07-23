import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/overview', controller.getOverviewCards);
router.get('/production-progress', controller.getProductionProgress);
router.get('/inventory-status', controller.getInventoryStatus);
router.get('/recent-activities', controller.getRecentActivities);
router.get('/analytics-summary', controller.getAnalyticsSummary);

export default router;
