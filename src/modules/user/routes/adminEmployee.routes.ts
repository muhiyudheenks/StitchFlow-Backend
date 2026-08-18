import { Router } from 'express';
import {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    resendSetupLink,
} from '../controllers/adminEmployee.controller';
import { validateRequest } from '../middleware/validateRequest.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/admin.validators';

const router = Router();

router.get('/', getEmployees);
router.post('/', validateRequest(createEmployeeSchema), createEmployee);
router.get('/:id', getEmployeeById);
router.put('/:id', validateRequest(updateEmployeeSchema), updateEmployee);
router.patch('/:id', validateRequest(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);
router.post('/:id/resend-setup-link', resendSetupLink);

export default router;
