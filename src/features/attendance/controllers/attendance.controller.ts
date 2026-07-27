import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { AttendanceService } from '../services/attendance.service';

const service = new AttendanceService();

export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const data = await service.getTodayAttendance(userId);
        return res.status(200).json({ success: true, message: 'Today attendance retrieved', data });
    } catch (err: any) {
        console.error('[AttendanceController.getTodayAttendance Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Failed to get attendance' });
    }
};

export const checkIn = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const data = await service.checkIn(userId);
        return res.status(200).json({ success: true, message: 'Check-in successful', data });
    } catch (err: any) {
        console.error('[AttendanceController.checkIn Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Check-in failed' });
    }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const data = await service.checkOut(userId);
        return res.status(200).json({ success: true, message: 'Check-out successful', data });
    } catch (err: any) {
        console.error('[AttendanceController.checkOut Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Check-out failed' });
    }
};

export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const data = await service.getAttendanceHistory(userId);
        return res.status(200).json({ success: true, message: 'Attendance history retrieved', data });
    } catch (err: any) {
        console.error('[AttendanceController.getAttendanceHistory Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Failed to get history' });
    }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role || 'employee';
        const userId = req.user?.id;
        const data = await service.getAllAttendance(role, userId!);
        return res.status(200).json({ success: true, message: 'All attendance records retrieved', data });
    } catch (err: any) {
        console.error('[AttendanceController.getAllAttendance Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve attendance records' });
    }
};
