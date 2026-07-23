import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { AttendanceService } from '../services/attendance.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';

export class AttendanceController {
    private service = new AttendanceService();

    checkIn = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const record = await this.service.checkIn(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.CREATED,
                true,
                RESPONSE_MESSAGES.ATTENDANCE_CHECKIN_SUCCESS,
                record
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Check-in failed'
            );
        }
    };

    checkOut = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const record = await this.service.checkOut(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.ATTENDANCE_CHECKOUT_SUCCESS,
                record
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Check-out failed'
            );
        }
    };

    getTodayAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const records = await this.service.getTodayAttendance();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                "Today's attendance records retrieved successfully",
                records
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || "Failed to retrieve today's attendance"
            );
        }
    };

    getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const summary = await this.service.getAttendanceSummary();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Attendance summary retrieved successfully',
                summary
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve attendance summary'
            );
        }
    };

    getEmployeeAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to retrieve employee attendance'
            );
        }
    };

    getMonthlyAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve monthly attendance report'
            );
        }
    };
}
