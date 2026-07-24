import { Router } from 'express';
import {
    getDashboardData,
    updateProfile,
    toggleAttendance,
    applyLeave,
} from '../controllers/employee.controller';

const router = Router();

router.get('/dashboard', getDashboardData);
router.patch('/profile', updateProfile);
router.post('/attendance/toggle', toggleAttendance);
router.post('/leaves', applyLeave);

export default router;
