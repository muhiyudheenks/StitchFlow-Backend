import { Router } from 'express';
import adminEmployeeRoutes from './adminEmployee.routes';
import adminManagerRoutes from './adminManager.routes';
import productionRoutes from '../../production/routes/adminProduction.routes';
import inventoryRoutes from '../../inventory/routes/adminInventory.routes';
import attendanceRoutes from '../../attendance/routes/adminAttendance.routes';
import dashboardRoutes from '../../dashboard/routes/dashboard.routes';
import garmentProductRoutes from '../../production/routes/garmentProduct.routes';

const router = Router();

router.use('/employees', adminEmployeeRoutes);
router.use('/managers', adminManagerRoutes);
router.use('/production', productionRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/garment-products', garmentProductRoutes);

export default router;
