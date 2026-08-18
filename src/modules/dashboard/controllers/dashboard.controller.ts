import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ManagerDashboardService } from '../services/managerDashboard.service';
import { EmployeeDashboardService } from '../services/employeeDashboard.service';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS } from '../../user/constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';
import { AdminDashboardService } from '..';

export class DashboardController {
    constructor(
        private adminService: AdminDashboardService = new AdminDashboardService(),
        private managerService: ManagerDashboardService = new ManagerDashboardService(),
        private employeeService: EmployeeDashboardService = new EmployeeDashboardService()
    ) { }

    getOverviewCards = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const role = req.user?.role;
        const userId = req.user?.id;

        if (role === 'admin') {
            const data = await this.adminService.getOverviewCards();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Dashboard overview metrics retrieved successfully', data);
        } else if (role === 'manager') {
            const data = await this.managerService.getDashboardOverview(userId);
            return sendResponse(res, HTTP_STATUS.OK, true, 'Manager dashboard overview retrieved successfully', data);
        } else if (role === 'employee') {
            const data = await this.employeeService.getDashboardData(userId);
            return sendResponse(res, HTTP_STATUS.OK, true, 'Employee dashboard overview retrieved successfully', data);
        } else {
            throw AppError.forbidden('Invalid user role for dashboard overview');
        }
    });

    getProductionProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const role = req.user?.role;
        const userId = req.user?.id;

        if (role === 'admin') {
            const data = await this.adminService.getProductionProgress();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Production progress summary retrieved successfully', data);
        } else if (role === 'manager') {
            const data = await this.managerService.getAssignedBatches(userId);
            return sendResponse(res, HTTP_STATUS.OK, true, 'Manager assigned batches retrieved successfully', data);
        } else {
            const data = await this.employeeService.getDashboardData(userId);
            return sendResponse(res, HTTP_STATUS.OK, true, 'Employee production progress retrieved successfully', data.production);
        }
    });

    getInventoryStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.adminService.getInventoryStatus();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Inventory status retrieved successfully', data);
    });

    getRecentActivities = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
        const activities = await this.adminService.getRecentActivities(limit);
        return sendResponse(res, HTTP_STATUS.OK, true, 'Recent activities retrieved successfully', activities);
    });

    getAnalyticsSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const analytics = await this.adminService.getAnalyticsSummary();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Analytics summary retrieved successfully', analytics);
    });
}
