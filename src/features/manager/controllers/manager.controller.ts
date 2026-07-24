import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ManagerService } from '../services/manager.service';

const managerService = new ManagerService();

export const getDashboardOverview = async (req: AuthRequest, res: Response) => {
    try {
        const data = await managerService.getDashboardOverview(req.user?.id);
        return res.status(200).json({ success: true, message: 'Overview retrieved successfully', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getTeamEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const search = req.query.search as string;
        const department = req.query.department as string;
        const data = await managerService.getTeamEmployees(req.user?.id, search, department);
        return res.status(200).json({ success: true, message: 'Employees retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const department = req.query.department as string;
        const data = await managerService.getTasks(department);
        return res.status(200).json({ success: true, message: 'Tasks retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await managerService.createTask(req.body, req.user?.id || '');
        return res.status(201).json({ success: true, message: 'Task created successfully', data: task });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await managerService.updateTask(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
    try {
        const data = await managerService.getAttendanceRecords();
        return res.status(200).json({ success: true, message: 'Attendance records retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const data = await managerService.getLeaveRequests();
        return res.status(200).json({ success: true, message: 'Leave requests retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const leave = await managerService.updateLeaveStatus(req.params.id, status, req.user?.id || '');
        return res.status(200).json({ success: true, message: `Leave ${status} successfully`, data: leave });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getProductionBatches = async (req: AuthRequest, res: Response) => {
    try {
        const data = await managerService.getProductionBatches();
        return res.status(200).json({ success: true, message: 'Production batches retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await managerService.createProductionBatch(req.body, req.user?.id || '');
        return res.status(201).json({ success: true, message: 'Production batch created', data: batch });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await managerService.updateProductionBatch(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Batch updated', data: batch });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getInventoryOverview = async (req: AuthRequest, res: Response) => {
    try {
        const data = await managerService.getInventoryOverview();
        return res.status(200).json({ success: true, message: 'Inventory retrieved (Read-Only)', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        const type = req.query.type as string;
        const data = await managerService.getReports(type);
        return res.status(200).json({ success: true, message: 'Reports generated', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
