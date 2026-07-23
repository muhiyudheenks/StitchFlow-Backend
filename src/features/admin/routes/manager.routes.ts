import { Router } from 'express';
import { ManagerController } from '../controllers/manager.controller';
import { validateRequest } from '../middleware/admin.middleware';
import { createManagerSchema, updateManagerSchema, assignEmployeesSchema } from '../validators/admin.validators';

const router = Router();
const controller = new ManagerController();

router.post('/', validateRequest(createManagerSchema), controller.createManager);
router.get('/', controller.getManagers);
router.get('/:id', controller.getManagerById);
router.put('/:id', validateRequest(updateManagerSchema), controller.updateManager);
router.delete('/:id', controller.deleteManager);
router.post('/:id/assign-employees', validateRequest(assignEmployeesSchema), controller.assignEmployees);
router.put('/:id/assign', validateRequest(assignEmployeesSchema), controller.assignEmployees);
router.get('/:id/summary', controller.getManagerSummary);

export default router;
