import { Router } from 'express';
import {
    createGarmentProduct,
    getGarmentProducts,
    getActiveGarmentProducts,
    getGarmentProductById,
    updateGarmentProduct,
    toggleGarmentProductStatus,
    deleteGarmentProduct,
} from '../../production/controllers/garmentProduct.controller';

const router = Router();

router.post('/', createGarmentProduct);
router.get('/', getGarmentProducts);
router.get('/active', getActiveGarmentProducts);
router.get('/:id', getGarmentProductById);
router.put('/:id', updateGarmentProduct);
router.patch('/:id/status', toggleGarmentProductStatus);
router.delete('/:id', deleteGarmentProduct);

export default router;
