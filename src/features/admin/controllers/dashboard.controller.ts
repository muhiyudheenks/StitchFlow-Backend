import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { DashboardService } from '../services/dashboard.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';

export class DashboardController {
    private service = new DashboardService();

    getOverviewCards = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getOverviewCards();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Dashboard overview metrics retrieved successfully',
                data
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve overview cards data'
            );
        }
    };

    getProductionProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getProductionProgress();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Production progress summary retrieved successfully',
                data
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve production progress'
            );
        }
    };

    getInventoryStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getInventoryStatus();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Inventory status retrieved successfully',
                data
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve inventory status'
            );
        }
    };

    getRecentActivities = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
            const activities = await this.service.getRecentActivities(limit);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Recent activities retrieved successfully',
                activities
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve recent activities'
            );
        }
    };

    getAnalyticsSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const analytics = await this.service.getAnalyticsSummary();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Analytics summary retrieved successfully',
                analytics
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve analytics summary'
            );
        }
    };
}
