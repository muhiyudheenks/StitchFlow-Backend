import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ManagerService } from '../services/manager.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export class ManagerController {
    private service = new ManagerService();

    createManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const manager = await this.service.createManager(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            RESPONSE_MESSAGES.MANAGER_CREATED,
            manager
        );
    });

    getManagers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const result = await this.service.getManagers(req.query);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Managers retrieved successfully',
            result.managers,
            result.pagination
        );
    });

    getManagerById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const manager = await this.service.getManagerById(id);
        if (!manager) {
            throw AppError.notFound(RESPONSE_MESSAGES.MANAGER_NOT_FOUND);
        }
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Manager details retrieved successfully',
            manager
        );
    });

    updateManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        const updated = await this.service.updateManager(id, req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.MANAGER_UPDATED,
            updated
        );
    });

    deleteManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        await this.service.deleteManager(id, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.MANAGER_DELETED
        );
    });

    assignEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const { employeeIds } = req.body;
        const adminEmail = req.user?.email || 'Admin';
        const result = await this.service.assignEmployees(id, employeeIds, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.EMPLOYEES_ASSIGNED,
            result
        );
    });

    getManagerSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const summary = await this.service.getManagerSummary(id);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Manager summary retrieved successfully',
            summary
        );
    });
}
