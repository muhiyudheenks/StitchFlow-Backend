import { Router } from 'express';
import employeeRoutes from './employee.routes';
import managerRoutes from './manager.routes';
import productionRoutes from './production.routes';
import inventoryRoutes from './inventory.routes';
import attendanceRoutes from './attendance.routes';
import dashboardRoutes from './dashboard.routes';
import userManagementRoutes from './userManagement.routes';

const router = Router();

router.use('/employees', employeeRoutes);
router.use('/managers', managerRoutes);
router.use('/production', productionRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', userManagementRoutes);

export default router;
