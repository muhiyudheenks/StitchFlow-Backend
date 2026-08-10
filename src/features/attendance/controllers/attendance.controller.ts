import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { AttendanceService } from '../services/attendance.service';
import { asyncHandler, AppError } from '../../../shared/errors';

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
