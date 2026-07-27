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

const router = Router();

router.get('/dashboard', getDashboardData);
router.get('/performance/me', getPerformanceData);
router.get('/performance/team', getTeamPerformance);
router.get('/performance/:employeeId', getEmployeePerformanceById);
router.get('/performance', getPerformanceData);

router.patch('/profile', updateProfile);
router.post('/attendance/toggle', toggleAttendance);
router.post('/leaves', applyLeave);

export default router;
