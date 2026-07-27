import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { TaskService } from '../services/tasks.service';

const taskService = new TaskService();

export const getAllTasks = async (req: AuthRequest, res: Response) => {
    try {
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

        console.log('[TasksController.getAllTasks] Query params:', req.query, 'Filter:', filter);
        const data = await taskService.getAllTasks(filter);
        console.log(`[TasksController.getAllTasks] Returning ${data.length} tasks`);
        return res.status(200).json({ success: true, message: 'Tasks retrieved successfully', data });
    } catch (err: any) {
        console.error('[TasksController.getAllTasks Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getTasksByBatch = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        console.log(`[TasksController.getTasksByBatch] Fetching tasks for batchId: ${batchId}`);
        const data = await taskService.getTasksByBatch(batchId);
        return res.status(200).json({ success: true, message: 'Batch tasks retrieved', data });
    } catch (err: any) {
        console.error('[TasksController.getTasksByBatch Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const creatorId = req.user?.id || 'Manager';
        console.log('[TasksController.createTask] Payload:', req.body, 'Creator:', creatorId);
        const task = await taskService.createTask(req.body, creatorId);
        console.log('[TasksController.createTask] Task created successfully:', task.id);
        return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
    } catch (err: any) {
        console.error('[TasksController.createTask Validation Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Failed to create task' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
    } catch (err: any) {
        console.error('[TasksController.updateTask Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Failed to update task' });
    }
};

export const updateTaskProgress = async (req: AuthRequest, res: Response) => {
    try {
        const { completedQuantity, status } = req.body;
        const task = await taskService.updateTaskProgress(req.params.id, completedQuantity, status);
        return res.status(200).json({ success: true, message: 'Task progress updated', data: task });
    } catch (err: any) {
        console.error('[TasksController.updateTaskProgress Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Failed to update progress' });
    }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.completeTask(req.params.id);
        return res.status(200).json({ success: true, message: 'Task submitted for verification', data: task });
    } catch (err: any) {
        console.error('[TasksController.completeTask Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Failed to submit task' });
    }
};

export const verifyTask = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        if (!['Completed', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid verification status' });
        }
        const task = await taskService.verifyTask(req.params.id, status, req.user?.id || '');
        return res.status(200).json({ success: true, message: `Task verified as ${status}`, data: task });
    } catch (err: any) {
        console.error('[TasksController.verifyTask Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Verification failed' });
    }
};
