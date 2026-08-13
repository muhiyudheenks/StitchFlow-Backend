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
import protect from '../../../shared/middleware/authMiddleware';
import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

const router = Router();
router.use(protect);


router.post('/', requirePermission(PERMISSIONS.PRODUCTION_CREATE), createGarmentProduct);
router.get('/', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getGarmentProducts);
router.get('/active', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getActiveGarmentProducts);
router.get('/:id', requirePermission(PERMISSIONS.PRODUCTION_VIEW), getGarmentProductById);
router.put('/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), updateGarmentProduct);
router.patch('/:id/status', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), toggleGarmentProductStatus);
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), deleteGarmentProduct);

export default router;
