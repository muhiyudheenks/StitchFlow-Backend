import { Router } from 'express';
import {
    getProductionBatches,
    getProductionBatchById,
    createProductionBatch,
    updateProductionBatch,
} from '../controllers/production.controller';

const router = Router();

// Production Batch Container Routes
router.get('/', getProductionBatches);
router.get('/:id', getProductionBatchById);
router.post('/', createProductionBatch);
router.patch('/:id', updateProductionBatch);
router.put('/:id', updateProductionBatch);

export default router;
