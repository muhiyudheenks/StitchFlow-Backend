import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { LeaveService } from '../services/leave.service';

const leaveService = new LeaveService();

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const data = await leaveService.getLeaveRequests();
        return res.status(200).json({ success: true, message: 'Leave requests retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const applyLeave = async (req: AuthRequest, res: Response) => {
    try {
        const leave = await leaveService.applyLeave(req.user?.id || '', req.body);
        return res.status(201).json({ success: true, message: 'Leave application submitted', data: leave });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const leave = await leaveService.updateLeaveStatus(req.params.id, status, req.user?.id || '');
        return res.status(200).json({ success: true, message: `Leave ${status}`, data: leave });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
