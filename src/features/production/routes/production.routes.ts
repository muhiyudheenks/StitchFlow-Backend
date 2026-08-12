import { Router } from 'express';
import {
    getProductionBatches,
    getProductionBatchById,
    getAvailableEmployees,
    addMemberToBatch,
    removeMemberFromBatch,
    completeBatch,
    createProductionBatch,
    updateProductionBatch,
    deleteProductionBatch,
    deleteTask,
    addTaskToInventory,
    createProduction,
    getProductions,
    getProductionById,
    updateProduction,
    deleteProduction,
    getTodayProduction,
    getTarget,
    getCompleted,
    getRemaining,
    getEfficiency,
} from '../controllers/production.controller';
import { validateRequest } from '../../user/middleware/validateRequest.middleware';
import { createProductionSchema, updateProductionSchema } from '../../user/validators/admin.validators';
import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

const router = Router();
export const adminRouter = Router();

// Production Batch Container & Member & Task Routes
router.get('/', getProductionBatches);
router.get('/available-employees', getAvailableEmployees);
router.delete('/tasks/:id', deleteTask);
router.post('/tasks/:id/inventory', requirePermission(PERMISSIONS.INVENTORY_CREATE), addTaskToInventory);
router.get('/:id', getProductionBatchById);
router.post('/:id/members', addMemberToBatch);
router.delete('/:id/members/:employeeId', removeMemberFromBatch);
router.patch('/:id/complete', completeBatch);
router.post('/', createProductionBatch);
router.patch('/:id', updateProductionBatch);
router.put('/:id', updateProductionBatch);
router.delete('/:id', deleteProductionBatch);

// Admin production task routes
adminRouter.post('/', validateRequest(createProductionSchema), createProduction);
adminRouter.get('/', getProductions);
adminRouter.get('/today', getTodayProduction);
adminRouter.get('/target', getTarget);
adminRouter.get('/completed', getCompleted);
adminRouter.get('/remaining', getRemaining);
adminRouter.get('/efficiency', getEfficiency);
adminRouter.get('/:id', getProductionById);
adminRouter.put('/:id', validateRequest(updateProductionSchema), updateProduction);
adminRouter.delete('/:id', deleteProduction);

export default router;
