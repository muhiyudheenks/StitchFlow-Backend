import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as leaveService from '../services/leave.service';
import { asyncHandler, AppError } from '../../../shared/errors';

export const getMyLeaves = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) throw AppError.unauthorized('Unauthorized');

    const data = await leaveService.getMyLeaves(userId);
    return res.status(200).json({ success: true, message: 'My leave data retrieved', data });
});

export const getLeaveRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await leaveService.getLeaveRequests();
    return res.status(200).json({ success: true, message: 'Leave requests retrieved', data });
});

export const applyLeave = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const leave = await leaveService.applyLeave(req.user?.id || '', req.body);
    return res.status(201).json({ success: true, message: 'Leave application submitted', data: leave });
});

export const updateLeaveStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;
    const leave = await leaveService.updateLeaveStatus(req.params.id, status, req.user?.id || '');
    return res.status(200).json({ success: true, message: `Leave ${status}`, data: leave });
});
