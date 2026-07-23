import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { InventoryService } from '../services/inventory.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';

export class InventoryController {
    private service = new InventoryService();

    createItem = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const item = await this.service.createItem(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.CREATED,
                true,
                RESPONSE_MESSAGES.ITEM_CREATED,
                item
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to create item'
            );
        }
    };

    getItems = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const result = await this.service.getItems(req.query);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Inventory items retrieved successfully',
                result.items,
                result.pagination
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve inventory items'
            );
        }
    };

    getItemById = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const item = await this.service.getItemById(id);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Item details retrieved successfully',
                item
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                false,
                error.message || RESPONSE_MESSAGES.ITEM_NOT_FOUND
            );
        }
    };

    updateItem = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to update item'
            );
        }
    };

    deleteItem = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            await this.service.deleteItem(id, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.ITEM_DELETED
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to delete item'
            );
        }
    };

    stockIn = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to process stock in'
            );
        }
    };

    stockOut = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to process stock out'
            );
        }
    };

    getLowStock = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const items = await this.service.getLowStock();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Low stock items retrieved successfully',
                items
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve low stock items'
            );
        }
    };

    getSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const summary = await this.service.getSummary();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Inventory summary retrieved successfully',
                summary
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve inventory summary'
            );
        }
    };
}
