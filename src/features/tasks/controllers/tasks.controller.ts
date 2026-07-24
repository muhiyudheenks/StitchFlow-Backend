import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { TaskService } from '../services/tasks.service';

const taskService = new TaskService();

export const getAllTasks = async (req: AuthRequest, res: Response) => {
    try {
        const department = req.query.department as string;
        const data = await taskService.getAllTasks(department);
        return res.status(200).json({ success: true, message: 'Tasks retrieved successfully', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.createTask(req.body, req.user?.id || '');
        return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
