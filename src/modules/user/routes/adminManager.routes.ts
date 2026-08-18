import { Router } from 'express';
import {
    getManagers,
    getManagerById,
    createManager,
    updateManager,
    deleteManager,
    assignEmployees,
    resendSetupLink,
} from '../controllers/adminManager.controller';
import { validateRequest } from '../middleware/validateRequest.middleware';
import { createManagerSchema, updateManagerSchema, assignEmployeesSchema } from '../validators/admin.validators';

const router = Router();

router.get('/', getManagers);
router.post('/', validateRequest(createManagerSchema), createManager);
router.get('/:id', getManagerById);
router.put('/:id', validateRequest(updateManagerSchema), updateManager);
router.patch('/:id', validateRequest(updateManagerSchema), updateManager);
router.delete('/:id', deleteManager);
router.post('/:id/assign-employees', validateRequest(assignEmployeesSchema), assignEmployees);
router.post('/:id/resend-setup-link', resendSetupLink);

export default router;
