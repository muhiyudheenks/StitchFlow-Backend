import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { TaskService } from '../services/tasks.service';
import { asyncHandler, AppError } from '../../../shared/errors';

const taskService = new TaskService();

export const getAllTasks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const filter: any = {};
    if (req.user?.role === 'employee') {
        filter.assignedEmployee = req.user.id;
    }
    if (req.query.batchId) {
        filter.batchId = req.query.batchId as string;
    }
    if (req.query.status) {
        filter.status = req.query.status as string;
    }

    const data = await taskService.getAllTasks(filter);
    return res.status(200).json({ success: true, message: 'Tasks retrieved successfully', data });
});

export const getTasksByBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { batchId } = req.params;
    const data = await taskService.getTasksByBatch(batchId);
    return res.status(200).json({ success: true, message: 'Batch tasks retrieved', data });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const creatorId = req.user?.id || 'Manager';
    const task = await taskService.createTask(req.body, creatorId);
    return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await taskService.updateTask(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
});

export const updateTaskProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { completedQuantity, status } = req.body;
    const task = await taskService.updateTaskProgress(req.params.id, completedQuantity, status);
    return res.status(200).json({ success: true, message: 'Task progress updated', data: task });
});

export const completeTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await taskService.completeTask(req.params.id);
    return res.status(200).json({ success: true, message: 'Task submitted for verification', data: task });
});

export const verifyTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status } = req.body;
    if (!['Completed', 'Rejected'].includes(status)) {
        throw AppError.badRequest('Invalid verification status');
    }
    const task = await taskService.verifyTask(req.params.id, status, req.user?.id || '');
    return res.status(200).json({ success: true, message: `Task verified as ${status}`, data: task });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await taskService.deleteTask(req.params.id);
    return res.status(200).json({ success: true, message: 'Task deleted successfully', data: task });
});
