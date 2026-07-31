import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionService } from '../services/production.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export class ProductionController {
    private service = new ProductionService();

    createProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const production = await this.service.createProduction(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            RESPONSE_MESSAGES.PRODUCTION_CREATED,
            production
        );
    });

    getProductions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const result = await this.service.getProductions(req.query);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Production entries retrieved successfully',
            result.productions,
            result.pagination
        );
    });

    getProductionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const production = await this.service.getProductionById(id);
        if (!production) {
            throw AppError.notFound(RESPONSE_MESSAGES.PRODUCTION_NOT_FOUND);
        }
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Production details retrieved successfully',
            production
        );
    });

    updateProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
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
    });

    deleteProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        await this.service.deleteProduction(id, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.PRODUCTION_DELETED
        );
    });

    getTodayProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const today = await this.service.getTodayProduction();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            "Today's production entries retrieved successfully",
            today
        );
    });

    getTarget = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getTarget();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Target quantity retrieved successfully', data);
    });

    getCompleted = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getCompleted();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Completed quantity retrieved successfully', data);
    });

    getRemaining = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getRemaining();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Remaining quantity retrieved successfully', data);
    });

    getEfficiency = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const data = await this.service.getEfficiency();
        return sendResponse(res, HTTP_STATUS.OK, true, 'Production efficiency retrieved successfully', data);
    });
}
