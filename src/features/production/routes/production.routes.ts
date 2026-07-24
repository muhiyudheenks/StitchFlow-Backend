import { Router } from 'express';
import { getProductionBatches, createProductionBatch, updateProductionBatch } from '../controllers/production.controller';

const router = Router();

router.get('/', getProductionBatches);
router.post('/', createProductionBatch);
router.put('/:id', updateProductionBatch);
router.patch('/:id', updateProductionBatch);

export default router;
