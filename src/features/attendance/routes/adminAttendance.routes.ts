import { Router } from 'express';
import { AttendanceController } from '../controllers/adminAttendance.controller';
import { validateRequest } from '../../user/middleware/validateRequest.middleware';
import { checkInSchema, checkOutSchema } from '../../user/validators/admin.validators';
import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

// This router is mounted at /api/admin/attendance via adminApi.routes.ts.

const router = Router();
const controller = new AttendanceController();

// ─── Attendance management (admin creates/corrects records for employees) ─────
// Requires ATTENDANCE_MANAGE — admins must explicitly have this permission.
router.post('/check-in', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), validateRequest(checkInSchema), controller.checkIn);
router.post('/check-out', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), validateRequest(checkOutSchema), controller.checkOut);
router.get('/employee/:employeeId', requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), controller.getEmployeeAttendance);

// ─── Attendance view (read-only dashboard queries) ────────────────────────────
// Requires ATTENDANCE_VIEW — admins must explicitly have this permission.
router.get('/today', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), controller.getTodayAttendance);
router.get('/summary', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), controller.getAttendanceSummary);
router.get('/monthly', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), controller.getMonthlyAttendance);

export default router;
