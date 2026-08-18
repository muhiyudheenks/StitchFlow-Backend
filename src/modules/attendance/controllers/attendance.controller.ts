import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { asyncHandler, AppError } from '../../../shared/errors';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../user/constants/admin.constants';
import AttendanceService from '../services/attendance.service';

const service = new AttendanceService();

export const getTodayAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('Unauthorized');

    const data = await service.getTodayAttendance(userId);
    return res.status(200).json({ success: true, message: 'Today attendance retrieved', data });
});

export const checkIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('Unauthorized');

    const data = await service.checkIn(userId);
    return res.status(200).json({
        success: true,
        message: 'Check-in successful',
        data,
    });
});

export const checkOut = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('Unauthorized');

    const data = await service.checkOut(userId);
    return res.status(200).json({
        success: true,
        message: 'Check-out successful',
        data,
    });
});

export const getAttendanceHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('Unauthorized');

    const data = await service.getAttendanceHistory(userId);
    return res.status(200).json({ success: true, message: 'Attendance history retrieved', data });
});

export const getAllAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role || 'admin';
    const userId = req.user?.id || '';
    const data = await service.getAllAttendance(role, userId);
    return res.status(200).json({ success: true, message: 'All attendance records retrieved', data });
});

// --- Admin handlers (preserve existing admin response formats) ---
export const adminCheckIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const record = await service.checkIn(req.body);
    return sendResponse(res, HTTP_STATUS.CREATED, true, RESPONSE_MESSAGES.ATTENDANCE_CHECKIN_SUCCESS, record);
});

export const adminCheckOut = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const record = await service.checkOut(req.body);
    return sendResponse(res, HTTP_STATUS.OK, true, RESPONSE_MESSAGES.ATTENDANCE_CHECKOUT_SUCCESS, record);
});

export const adminGetTodayAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const records = await service.getTodayAttendance();
    return sendResponse(res, HTTP_STATUS.OK, true, "Today's attendance records retrieved successfully", records);
});

export const adminGetAttendanceSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const summary = await service.getAttendanceSummary();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Attendance summary retrieved successfully', summary);
});

export const adminGetEmployeeAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { employeeId } = req.params;
    const data = await service.getEmployeeAttendance(employeeId, req.query);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee attendance history retrieved successfully', data.records, data.pagination);
});

export const adminGetMonthlyAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const data = await service.getMonthlyAttendance(year, month);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Monthly attendance report retrieved successfully', data);
});
