import { Router } from 'express';
import { ProductionLineController } from '../controllers/productionLineController';

const router = Router();
const controller = new ProductionLineController();

router.post('/', controller.createLine);
router.get('/', controller.getAllLines);
router.get('/:id', controller.getLineById);
router.put('/:id', controller.updateLine);
router.delete('/:id', controller.deleteLine);
router.patch('/:lineId/assign-employees', controller.assignEmployees);

export default router;
