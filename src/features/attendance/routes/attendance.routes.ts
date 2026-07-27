import { Router } from 'express';
import {
    getTodayAttendance,
    checkIn,
    checkOut,
    getAttendanceHistory,
    getAllAttendance,
} from '../controllers/attendance.controller';

const router = Router();

router.get('/today', getTodayAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', getAttendanceHistory);
router.get('/all', getAllAttendance);

export default router;
