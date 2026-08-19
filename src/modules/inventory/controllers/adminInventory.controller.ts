import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as service from '../services/adminInventory.service';
import { sendResponse } from '../../user/utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../user/constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export const createItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    const item = await service.createItem(req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        true,
        RESPONSE_MESSAGES.ITEM_CREATED,
        item
    );
});

export const getItems = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const result = await service.getItems(req.query);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Inventory items retrieved successfully',
        result.items,
        result.pagination
    );
});

export const getItemById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { id } = req.params;
    const item = await service.getItemById(id);
    if (!item) {
        throw AppError.notFound(RESPONSE_MESSAGES.ITEM_NOT_FOUND);
    }
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Item details retrieved successfully',
        item
    );
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    const updated = await service.updateItem(id, req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.ITEM_UPDATED,
        updated
    );
});

export const deleteItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    await service.deleteItem(id, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.ITEM_DELETED
    );
});

export const stockIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    const updated = await service.stockIn(id, req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.STOCK_IN_SUCCESS,
        updated
    );
});

export const stockOut = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'Admin';
    const updated = await service.stockOut(id, req.body, adminEmail);
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        RESPONSE_MESSAGES.STOCK_OUT_SUCCESS,
        updated
    );
});

export const getLowStock = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const items = await service.getLowStock();
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Low stock items retrieved successfully',
        items
    );
});

export const getSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const summary = await service.getSummary();
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Inventory summary retrieved successfully',
        summary
    );
});
