import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as employeeService from '../services/employee.service';
import * as performanceService from '../services/performance.service';
import { asyncHandler } from '../../../shared/errors';

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await employeeService.getDashboardData(req.user?.id);
    return res.status(200).json({ success: true, message: 'Employee dashboard data loaded', data });
});

export const getPerformanceData = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || '';
    const data = await performanceService.getEmployeePerformance(userId);
    return res.status(200).json({ success: true, message: 'Performance metrics calculated successfully', data });
});

export const getEmployeePerformanceById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const employeeId = req.params.employeeId;
    const data = await performanceService.getEmployeePerformance(employeeId);
    return res.status(200).json({ success: true, message: 'Employee performance loaded', data });
});

export const getTeamPerformance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await performanceService.getTeamPerformance();
    return res.status(200).json({ success: true, message: 'Team performance metrics calculated', data });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await employeeService.updateProfile(req.user?.id || '', req.body);
    return res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
});

export const toggleAttendance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { action } = req.body; // 'check_in' | 'check_out'
    const result = await employeeService.toggleAttendance(req.user?.id || '', action);
    return res.status(200).json({ success: true, message: `Attendance ${action} logged`, data: result });
});

export const applyLeave = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const leave = await employeeService.applyLeave(req.user?.id || '', req.body);
    return res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leave });
});
