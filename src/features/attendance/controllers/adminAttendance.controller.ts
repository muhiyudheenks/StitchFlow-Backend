import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { AttendanceService } from '../services/adminAttendance.service';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../user/constants/admin.constants';
import { asyncHandler } from '../../../shared/errors';

export class AttendanceController {
    private service = new AttendanceService();

    checkIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const record = await this.service.checkIn(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            RESPONSE_MESSAGES.ATTENDANCE_CHECKIN_SUCCESS,
            record
        );
    });

    checkOut = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const record = await this.service.checkOut(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.ATTENDANCE_CHECKOUT_SUCCESS,
            record
        );
    });

    getTodayAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const records = await this.service.getTodayAttendance();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            "Today's attendance records retrieved successfully",
            records
        );
    });

    getAttendanceSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const summary = await this.service.getAttendanceSummary();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Attendance summary retrieved successfully',
            summary
        );
    });

    getEmployeeAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { employeeId } = req.params;
        const data = await this.service.getEmployeeAttendance(employeeId, req.query);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Employee attendance history retrieved successfully',
            data.records,
            data.pagination
        );
    });

    getMonthlyAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
        const data = await this.service.getMonthlyAttendance(year, month);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Monthly attendance report retrieved successfully',
            data
        );
    });
}
