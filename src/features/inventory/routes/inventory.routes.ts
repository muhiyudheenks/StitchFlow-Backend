import { Router } from 'express';
import { getInventoryItems, updateStock } from '../controllers/inventory.controller';

const router = Router();

router.get('/', getInventoryItems);
router.patch('/:id/stock', updateStock);

export default router;
