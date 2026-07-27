import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { EmployeeService } from '../services/employee.service';
import { PerformanceService } from '../services/performance.service';

const employeeService = new EmployeeService();
const performanceService = new PerformanceService();

export const getDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        const data = await employeeService.getDashboardData(req.user?.id);
        return res.status(200).json({ success: true, message: 'Employee dashboard data loaded', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getPerformanceData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id || '';
        const data = await performanceService.getEmployeePerformance(userId);
        return res.status(200).json({ success: true, message: 'Performance metrics calculated successfully', data });
    } catch (err: any) {
        console.error('[EmployeeController.getPerformanceData Error]:', err.message);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getEmployeePerformanceById = async (req: AuthRequest, res: Response) => {
    try {
        const employeeId = req.params.employeeId;
        const data = await performanceService.getEmployeePerformance(employeeId);
        return res.status(200).json({ success: true, message: 'Employee performance loaded', data });
    } catch (err: any) {
        console.error('[EmployeeController.getEmployeePerformanceById Error]:', err.message);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getTeamPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const data = await performanceService.getTeamPerformance();
        return res.status(200).json({ success: true, message: 'Team performance metrics calculated', data });
    } catch (err: any) {
        console.error('[EmployeeController.getTeamPerformance Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await employeeService.updateProfile(req.user?.id || '', req.body);
        return res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const toggleAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { action } = req.body; // 'check_in' | 'check_out'
        const result = await employeeService.toggleAttendance(req.user?.id || '', action);
        return res.status(200).json({ success: true, message: `Attendance ${action} logged`, data: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const applyLeave = async (req: AuthRequest, res: Response) => {
    try {
        const leave = await employeeService.applyLeave(req.user?.id || '', req.body);
        return res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leave });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
