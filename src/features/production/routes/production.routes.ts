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
} from '../controllers/production.controller';

import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

const router = Router();

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

export default router;
