import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as adminService from '../services/adminDashboard.service';
import * as managerService from '../services/managerDashboard.service';
import * as employeeService from '../services/employeeDashboard.service';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS } from '../../user/constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export const getOverviewCards = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === 'admin') {
        const data = await adminService.getOverviewCards();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Dashboard overview metrics retrieved successfully', data);
    } else if (role === 'manager') {
        const data = await managerService.getDashboardOverview(userId);
        return sendResponse(res, HTTP_STATUS.OK, true, 'Manager dashboard overview retrieved successfully', data);
    } else if (role === 'employee') {
        const data = await employeeService.getDashboardData(userId);
        return sendResponse(res, HTTP_STATUS.OK, true, 'Employee dashboard overview retrieved successfully', data);
    } else {
        throw AppError.forbidden('Invalid user role for dashboard overview');
    }
});

export const getProductionProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === 'admin') {
        const data = await adminService.getProductionProgress();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Production progress summary retrieved successfully', data);
    } else if (role === 'manager') {
        const data = await managerService.getAssignedBatches(userId);
        return sendResponse(res, HTTP_STATUS.OK, true, 'Manager assigned batches retrieved successfully', data);
    } else {
        const data = await employeeService.getDashboardData(userId);
        return sendResponse(res, HTTP_STATUS.OK, true, 'Employee production progress retrieved successfully', data.production);
    }
});

export const getInventoryStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const data = await adminService.getInventoryStatus();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Inventory status retrieved successfully', data);
});

export const getRecentActivities = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const activities = await adminService.getRecentActivities(limit);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Recent activities retrieved successfully', activities);
});

export const getAnalyticsSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const analytics = await adminService.getAnalyticsSummary();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Analytics summary retrieved successfully', analytics);
});
