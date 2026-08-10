import { Router } from 'express';
import { AttendanceController } from '../controllers/adminAttendance.controller';
import { validateRequest } from '../../user/middleware/validateRequest.middleware';
import { checkInSchema, checkOutSchema } from '../../user/validators/admin.validators';

const router = Router();
const controller = new AttendanceController();

router.post('/check-in', validateRequest(checkInSchema), controller.checkIn);
router.post('/check-out', validateRequest(checkOutSchema), controller.checkOut);
router.get('/today', controller.getTodayAttendance);
router.get('/summary', controller.getAttendanceSummary);
router.get('/monthly', controller.getMonthlyAttendance);
router.get('/employee/:employeeId', controller.getEmployeeAttendance);

export default router;
