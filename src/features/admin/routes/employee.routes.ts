import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { validateRequest } from '../middleware/admin.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/admin.validators';

const router = Router();
const controller = new EmployeeController();

router.post('/', validateRequest(createEmployeeSchema), controller.createEmployee);
router.get('/', controller.getEmployees);
router.get('/search', controller.getEmployees);
router.get('/:id', controller.getEmployeeById);
router.put('/:id', validateRequest(updateEmployeeSchema), controller.updateEmployee);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/resend-setup-link', controller.resendSetupLink);
router.delete('/:id', controller.deleteEmployee);

export default router;
