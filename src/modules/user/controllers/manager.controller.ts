import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as managerService from '../services/manager.service';
import { asyncHandler } from '../../../shared/errors';

export const getDashboardOverview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getDashboardOverview(req.user?.id);
    return res.status(200).json({ success: true, message: 'Overview retrieved successfully', data });
});

export const getTeamEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const search = req.query.search as string;
        const department = req.query.department as string;
        const data = await managerService.getTeamEmployees(req.user?.id, search, department);
        return res.status(200).json({ success: true, message: 'Employees retrieved', data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const department = req.query.department as string;
    const data = await managerService.getTasks(department);
    return res.status(200).json({ success: true, message: 'Tasks retrieved', data });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await managerService.createTask(req.body, req.user?.id || '');
    return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await managerService.updateTask(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
});

export const getAttendanceRecords = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = await managerService.getAttendanceRecords(req.user?.id);
        return res.status(200).json({ success: true, message: 'Attendance records retrieved', data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export const getLeaveRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getLeaveRequests(req.user?.id);
    return res.status(200).json({ success: true, message: 'Leave requests retrieved', data });
});

export const updateLeaveStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;
    const leave = await managerService.updateLeaveStatus(req.params.id, status, req.user?.id || '');
    return res.status(200).json({ success: true, message: `Leave ${status} successfully`, data: leave });
});

export const getProductionBatches = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getManagerAssignedBatches(req.user?.id || '');
    return res.status(200).json({ success: true, message: 'Production batches retrieved', data: data || [] });
});

export const getInventoryOverview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getInventoryOverview();
    return res.status(200).json({ success: true, message: 'Inventory retrieved (Read-Only)', data });
});

export const getReports = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const type = req.query.type as string;
    const data = await managerService.getReports(type);
    return res.status(200).json({ success: true, message: 'Reports generated', data });
});

// Manager Assigned Batches Workflow Controllers
export const getManagerBatches = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getManagerAssignedBatches(req.user?.id || '');
    return res.status(200).json({ success: true, data: data || [] });
});

export const getManagerBatchById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getManagerBatchById(req.params.batchId, req.user?.id || '');
    return res.status(200).json({ success: true, data });
});

export const getManagerBatchTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.getManagerBatchTasks(req.params.batchId, req.user?.id || '');
    return res.status(200).json({ success: true, data });
});

export const assignBatchTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.assignBatchTask(req.params.batchId, req.user?.id || '', req.body);
    return res.status(201).json({ success: true, message: 'Task assigned successfully', data });
});

export const updateBatchTaskStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await managerService.updateBatchTaskStatus(req.params.batchId, req.params.taskId, req.user?.id || '', req.body);
    return res.status(200).json({ success: true, message: 'Task updated successfully', data });
});

export const verifyBatchTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;
    const data = await managerService.verifyBatchTask(req.params.batchId, req.params.taskId, req.user?.id || '', status);
    return res.status(200).json({ success: true, message: 'Task verified successfully', data });
});
