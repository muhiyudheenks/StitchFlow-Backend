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
} from '../controllers/production.controller';

const router = Router();

// Production Batch Container & Member & Task Routes
router.get('/', getProductionBatches);
router.get('/available-employees', getAvailableEmployees);
router.delete('/tasks/:id', deleteTask);
router.get('/:id', getProductionBatchById);
router.post('/:id/members', addMemberToBatch);
router.delete('/:id/members/:employeeId', removeMemberFromBatch);
router.patch('/:id/complete', completeBatch);
router.post('/', createProductionBatch);
router.patch('/:id', updateProductionBatch);
router.put('/:id', updateProductionBatch);
router.delete('/:id', deleteProductionBatch);

export default router;
