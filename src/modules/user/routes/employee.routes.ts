import { Router } from 'express';
import {
    getDashboardData,
    getPerformanceData,
    getEmployeePerformanceById,
    getTeamPerformance,
    updateProfile,
    toggleAttendance,
    applyLeave,
} from '../controllers/employee.controller';
import notificationsRouter from '../../notifications/routes/notifications.routes';

const router = Router();

router.get('/dashboard', getDashboardData);
router.get('/performance/me', getPerformanceData);
router.get('/performance/team', getTeamPerformance);
router.get('/performance/:employeeId', getEmployeePerformanceById);
router.get('/performance', getPerformanceData);

router.patch('/profile', updateProfile);
router.post('/attendance/toggle', toggleAttendance);
router.post('/leaves', applyLeave);

// Mount Notifications sub-router under /api/employee/notifications
router.use('/notifications', notificationsRouter);

export default router;
