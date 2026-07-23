import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../middleware/admin.middleware';
import { createInventorySchema, updateInventorySchema, stockAdjustSchema } from '../validators/admin.validators';

const router = Router();
const controller = new InventoryController();

router.post('/', validateRequest(createInventorySchema), controller.createItem);
router.get('/', controller.getItems);
router.get('/low-stock', controller.getLowStock);
router.get('/summary', controller.getSummary);
router.get('/:id', controller.getItemById);
router.put('/:id', validateRequest(updateInventorySchema), controller.updateItem);
router.delete('/:id', controller.deleteItem);
router.post('/:id/stock-in', validateRequest(stockAdjustSchema), controller.stockIn);
router.post('/:id/stock-out', validateRequest(stockAdjustSchema), controller.stockOut);

export default router;
