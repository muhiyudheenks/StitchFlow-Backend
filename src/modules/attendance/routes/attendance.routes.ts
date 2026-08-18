import { Router } from 'express';
import {
    getTodayAttendance,
    checkIn,
    checkOut,
    getAttendanceHistory,
    getAllAttendance,
    adminCheckIn,
    adminCheckOut,
    adminGetEmployeeAttendance,
    adminGetTodayAttendance,
    adminGetAttendanceSummary,
    adminGetMonthlyAttendance,
} from '../controllers/attendance.controller';
import { validateRequest } from '../../user/middleware/validateRequest.middleware';
import { checkInSchema, checkOutSchema } from '../../user/validators/admin.validators';
import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

// protect is applied at the app level:

const router = Router();
const adminRouter = Router();

//Employee self-service routes 

router.get('/today', getTodayAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', getAttendanceHistory);

// Cross-employee view

router.get('/all', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), getAllAttendance);

// Admin attendance management and reports
adminRouter.post('/check-in', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), validateRequest(checkInSchema), adminCheckIn);
adminRouter.post('/check-out', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), validateRequest(checkOutSchema), adminCheckOut);
adminRouter.get('/employee/:employeeId', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), adminGetEmployeeAttendance);
adminRouter.get('/today', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), adminGetTodayAttendance);
adminRouter.get('/summary', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), adminGetAttendanceSummary);
adminRouter.get('/monthly', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), adminGetMonthlyAttendance);

export { adminRouter };
export default router;
