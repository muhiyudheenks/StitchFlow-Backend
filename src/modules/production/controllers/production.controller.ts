import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionService } from '../services/production.service';
import { TaskService } from '../../tasks/services/tasks.service';
import { asyncHandler, AppError } from '../../../shared/errors';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../user/constants/admin.constants';

const service = new ProductionService();
const taskService = new TaskService();

export const getProductionBatches = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    const userId = req.user?.id;
    const data = await service.getProductionBatches(role, userId);
    return res.status(200).json({ success: true, message: 'Production batches retrieved', data });
});

export const getProductionBatchById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.getProductionBatchById(req.params.id);
    if (!data) {
        throw AppError.notFound('Batch not found');
    }
    return res.status(200).json({ success: true, message: 'Production batch retrieved', data });
});

export const getAvailableEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const workerType = req.query.workerType as string;
    const data = await service.getAvailableEmployees(workerType);
    return res.status(200).json({ success: true, message: 'Available employees retrieved', data });
});

export const addMemberToBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { employeeId, employeeIds, employeeInput, workerType } = req.body;
    const raw = employeeIds || employeeId || employeeInput;
    const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (ids.length === 0) {
        throw AppError.badRequest('Employee ID(s) required');
    }
    const data = await service.addMemberToBatch(req.params.id, ids, workerType || 'Stitching');
    return res.status(200).json({ success: true, message: 'Employees added to batch successfully', data });
});

export const removeMemberFromBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.removeMemberFromBatch(req.params.id, req.params.employeeId);
    return res.status(200).json({ success: true, message: 'Employee removed from batch', data });
});

export const completeBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.completeBatch(req.params.id);
    return res.status(200).json({ success: true, message: 'Batch completed successfully', data });
});

export const createProductionBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const creator = req.user?.id || 'Admin';
    const batch = await service.createProductionBatch(req.body, creator);
    return res.status(201).json({
        success: true,
        message: 'Production batch created successfully',
        data: batch,
    });
});

export const updateProductionBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const batch = await service.updateProductionBatch(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Production batch updated successfully', data: batch });
});

export const deleteProductionBatch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const batch = await service.deleteProductionBatch(req.params.id);
    return res.status(200).json({ success: true, message: 'Production batch deleted successfully', data: batch });
});

export const createProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminEmail = req.user?.email || 'Admin';
    const production = await service.createProduction(req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        true,
        RESPONSE_MESSAGES.PRODUCTION_CREATED,
        production
    );
});

export const getProductions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = await service.getProductions(req.query);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Production entries retrieved successfully',
        result.productions,
        result.pagination
    );
});

export const getProductionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const production = await service.getProductionById(id);
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

export const updateProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    const updated = await service.updateProduction(id, req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.PRODUCTION_UPDATED,
        updated
    );
});

export const deleteProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    await service.deleteProduction(id, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.PRODUCTION_DELETED
    );
});

export const getTodayProduction = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const today = await service.getTodayProduction();
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        "Today's production entries retrieved successfully",
        today
    );
});

export const getTarget = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.getTarget();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Target quantity retrieved successfully', data);
});

export const getCompleted = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.getCompleted();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Completed quantity retrieved successfully', data);
});

export const getRemaining = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.getRemaining();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Remaining quantity retrieved successfully', data);
});

export const getEfficiency = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await service.getEfficiency();
    return sendResponse(res, HTTP_STATUS.OK, true, 'Production efficiency retrieved successfully', data);
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const task = await taskService.deleteTask(req.params.id);
    return res.status(200).json({ success: true, message: 'Task deleted successfully', data: task });
});

export const addTaskToInventory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const managerId = req.user?.id || 'Admin';
    const garment = await taskService.addTaskToInventory(req.params.id, managerId);
    return res.status(200).json({ success: true, message: 'Task added to inventory successfully', data: garment });
});
