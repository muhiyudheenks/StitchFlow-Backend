import { Router } from 'express';
import {
    getTodayAttendance,
    checkIn,
    checkOut,
    getAttendanceHistory,
    getAllAttendance,
} from '../controllers/attendance.controller';
import { requirePermission } from '../../../shared/middleware/requirePermission';
import { PERMISSIONS } from '../../../shared/constants/permissions';

// protect is applied at the app level:
//   app.use('/api/attendance', protect, attendanceRouter)
// All routes below are already authenticated — no need to call protect again.

const router = Router();

// ─── Employee self-service routes ────────────────────────────────────────────
// These routes always operate on the logged-in user's own record (req.user.id).
// Ownership is enforced in the service layer — no body-supplied employeeId is accepted.
// No extra permission required; any authenticated user may call these for their own data.
router.get('/today',   getTodayAttendance);
router.post('/check-in',  checkIn);
router.post('/check-out', checkOut);
router.get('/history', getAttendanceHistory);

// ─── Cross-employee view ──────────────────────────────────────────────────────
// Returns attendance across all employees (role-filtered inside the service).
// Employees have no permissions[], so they receive 403. Only managers/admins
// with ATTENDANCE_VIEW can access this.
router.get('/all', requirePermission(PERMISSIONS.ATTENDANCE_VIEW), getAllAttendance);

export default router;
