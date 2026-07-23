import { Router } from 'express';
import { ProductionController } from '../controllers/production.controller';
import { validateRequest } from '../middleware/admin.middleware';
import { createProductionSchema, updateProductionSchema } from '../validators/admin.validators';

const router = Router();
const controller = new ProductionController();

router.post('/', validateRequest(createProductionSchema), controller.createProduction);
router.get('/', controller.getProductions);
router.get('/today', controller.getTodayProduction);
router.get('/target', controller.getTarget);
router.get('/completed', controller.getCompleted);
router.get('/remaining', controller.getRemaining);
router.get('/efficiency', controller.getEfficiency);
router.get('/:id', controller.getProductionById);
router.put('/:id', validateRequest(updateProductionSchema), controller.updateProduction);
router.delete('/:id', controller.deleteProduction);

export default router;
