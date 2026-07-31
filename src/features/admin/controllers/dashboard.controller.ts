import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { DashboardService } from '../services/dashboard.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';
import { asyncHandler } from '../../../shared/errors';

export class DashboardController {
    private service = new DashboardService();

    getOverviewCards = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getOverviewCards();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Dashboard overview metrics retrieved successfully',
            data
        );
    });

    getProductionProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getProductionProgress();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Production progress summary retrieved successfully',
            data
        );
    });

    getInventoryStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getInventoryStatus();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Inventory status retrieved successfully',
            data
        );
    });

    getRecentActivities = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
        const activities = await this.service.getRecentActivities(limit);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Recent activities retrieved successfully',
            activities
        );
    });

    getAnalyticsSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const analytics = await this.service.getAnalyticsSummary();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Analytics summary retrieved successfully',
            analytics
        );
    });
}
