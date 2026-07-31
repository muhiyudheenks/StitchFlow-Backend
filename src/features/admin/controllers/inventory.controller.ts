import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { InventoryService } from '../services/inventory.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export class InventoryController {
    private service = new InventoryService();

    createItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const item = await this.service.createItem(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            RESPONSE_MESSAGES.ITEM_CREATED,
            item
        );
    });

    getItems = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const result = await this.service.getItems(req.query);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Inventory items retrieved successfully',
            result.items,
            result.pagination
        );
    });

    getItemById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const item = await this.service.getItemById(id);
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

    updateItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        const updated = await this.service.updateItem(id, req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.ITEM_UPDATED,
            updated
        );
    });

    deleteItem = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        await this.service.deleteItem(id, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.ITEM_DELETED
        );
    });

    stockIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        const updated = await this.service.stockIn(id, req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.STOCK_IN_SUCCESS,
            updated
        );
    });

    stockOut = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        const updated = await this.service.stockOut(id, req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.STOCK_OUT_SUCCESS,
            updated
        );
    });

    getLowStock = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const items = await this.service.getLowStock();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Low stock items retrieved successfully',
            items
        );
    });

    getSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const summary = await this.service.getSummary();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Inventory summary retrieved successfully',
            summary
        );
    });
}
