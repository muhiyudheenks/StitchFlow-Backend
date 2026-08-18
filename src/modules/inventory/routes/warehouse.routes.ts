import { Router } from 'express';
import { getWarehouses, createWarehouse, deleteWarehouse } from '../controllers/warehouse.controller';

const router = Router();

router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
