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
import protect from '../../../shared/middleware/authMiddleware';

const router = Router();
export const adminRouter = Router();

router.use(protect)
adminRouter.use(protect)

// Production Batch Container & Member & Task Routes
router.get('/', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getProductionBatches);
router.get('/available-employees', requirePermission(PERMISSIONS.EMPLOYEES_VIEW), getAvailableEmployees);
router.delete('/tasks/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), deleteTask);
router.post('/tasks/:id/inventory', requirePermission(PERMISSIONS.INVENTORY_CREATE), addTaskToInventory);
router.get('/:id', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getProductionBatchById);
router.post('/:id/members', requirePermission(PERMISSIONS.PRODUCTION_ASSIGN), addMemberToBatch);
router.delete('/:id/members/:employeeId', requirePermission(PERMISSIONS.PRODUCTION_ASSIGN), removeMemberFromBatch);
router.patch('/:id/complete', requirePermission(PERMISSIONS.PRODUCTION_VERIFY), completeBatch);
router.post('/', requirePermission(PERMISSIONS.PRODUCTION_CREATE), createProductionBatch);
router.patch('/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), updateProductionBatch);
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), updateProductionBatch);
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), deleteProductionBatch);

// Admin production task routes
adminRouter.post('/', requirePermission(PERMISSIONS.PRODUCTION_CREATE), validateRequest(createProductionSchema), createProduction);
adminRouter.get('/', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getProductions);
adminRouter.get('/today', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getTodayProduction);
adminRouter.get('/target', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getTarget);
adminRouter.get('/completed', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getCompleted);
adminRouter.get('/remaining', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getRemaining);
adminRouter.get('/efficiency', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getEfficiency);
adminRouter.get('/:id', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getProductionById);
adminRouter.put('/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), validateRequest(updateProductionSchema), updateProduction);
adminRouter.delete('/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), deleteProduction);

export default router;
