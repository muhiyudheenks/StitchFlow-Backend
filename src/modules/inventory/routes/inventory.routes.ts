import { Router } from 'express';
import * as controller from '../controllers/inventory.controller';

const router = Router();

// Fabric Routes
router.get('/fabric', controller.getFabrics);
router.post('/fabric', controller.createFabric);
router.put('/fabric/:id', controller.updateFabric);
router.delete('/fabric/:id', controller.deleteFabric);

// Thread Routes
router.get('/thread', controller.getThreads);
router.post('/thread', controller.createThread);
router.put('/thread/:id', controller.updateThread);
router.delete('/thread/:id', controller.deleteThread);

// Finished Garments Routes
router.get('/garments', controller.getGarments);
router.post('/garments', controller.createGarment);
router.put('/garments/:id', controller.updateGarment);
router.delete('/garments/:id', controller.deleteGarment);

// Summary, Analytics & Transactions Routes
router.get('/summary', controller.getSummary);
router.get('/analytics', controller.getAnalytics);
router.get('/transactions', controller.getTransactions);

// Categories Routes
import categoryRouter from './category.routes';
router.use('/categories', categoryRouter);

// Warehouses Routes
import warehouseRouter from './warehouse.routes';
router.use('/warehouses', warehouseRouter);

export default router;
