import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionService } from '../services/production.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';

export class ProductionController {
    private service = new ProductionService();

    createProduction = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const production = await this.service.createProduction(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.CREATED,
                true,
                RESPONSE_MESSAGES.PRODUCTION_CREATED,
                production
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to create production entry'
            );
        }
    };

    getProductions = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const result = await this.service.getProductions(req.query);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Production entries retrieved successfully',
                result.productions,
                result.pagination
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve production entries'
            );
        }
    };

    getProductionById = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const production = await this.service.getProductionById(id);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Production details retrieved successfully',
                production
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                false,
                error.message || RESPONSE_MESSAGES.PRODUCTION_NOT_FOUND
            );
        }
    };

    updateProduction = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            const updated = await this.service.updateProduction(id, req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.PRODUCTION_UPDATED,
                updated
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to update production entry'
            );
        }
    };

    deleteProduction = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            await this.service.deleteProduction(id, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.PRODUCTION_DELETED
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to delete production entry'
            );
        }
    };

    getTodayProduction = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const today = await this.service.getTodayProduction();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                "Today's production entries retrieved successfully",
                today
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || "Failed to retrieve today's production"
            );
        }
    };

    getTarget = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getTarget();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Target quantity retrieved successfully', data);
        } catch (error: any) {
            return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    getCompleted = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getCompleted();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Completed quantity retrieved successfully', data);
        } catch (error: any) {
            return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    getRemaining = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getRemaining();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Remaining quantity retrieved successfully', data);
        } catch (error: any) {
            return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };

    getEfficiency = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const data = await this.service.getEfficiency();
            return sendResponse(res, HTTP_STATUS.OK, true, 'Production efficiency retrieved successfully', data);
        } catch (error: any) {
            return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, error.message);
        }
    };
}
