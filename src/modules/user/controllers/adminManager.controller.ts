import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { AdminManagerService } from '../services/adminManager.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';
import { asyncHandler } from '../../../shared/errors';

const service = new AdminManagerService();

export const getManagers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const result = await service.getManagers(req.query as any);
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Managers retrieved successfully',
        data: result.managers,
        managers: result.managers,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});

export const getManagerById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const manager = await service.getManagerById(req.params.id);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Manager details retrieved successfully', manager);
});

export const createManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    const manager = await service.createManager(req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        true,
        'Manager created successfully. Setup invitation link sent.',
        manager
    );
});

export const updateManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    const manager = await service.updateManager(req.params.id, req.body, adminEmail);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Manager details updated successfully', manager);
});

export const deleteManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    await service.deleteManager(req.params.id, adminEmail);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Manager deleted successfully');
});

export const assignEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { employeeIds } = req.body;
    const result = await service.assignEmployees(req.params.id, employeeIds || []);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employees assigned successfully', result);
});

export const resendSetupLink = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    await service.resendSetupLink(req.params.id);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Setup password link resent successfully');
});
