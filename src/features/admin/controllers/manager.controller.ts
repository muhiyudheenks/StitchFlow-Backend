import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ManagerService } from '../services/manager.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';

export class ManagerController {
    private service = new ManagerService();

    createManager = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const manager = await this.service.createManager(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.CREATED,
                true,
                RESPONSE_MESSAGES.MANAGER_CREATED,
                manager
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to create manager'
            );
        }
    };

    getManagers = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const result = await this.service.getManagers(req.query);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Managers retrieved successfully',
                result.managers,
                result.pagination
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve managers'
            );
        }
    };

    getManagerById = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const manager = await this.service.getManagerById(id);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Manager details retrieved successfully',
                manager
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                false,
                error.message || RESPONSE_MESSAGES.MANAGER_NOT_FOUND
            );
        }
    };

    updateManager = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to update manager'
            );
        }
    };

    deleteManager = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            await this.service.deleteManager(id, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.MANAGER_DELETED
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to delete manager'
            );
        }
    };

    assignEmployees = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
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
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to assign employees'
            );
        }
    };

    getManagerSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const summary = await this.service.getManagerSummary(id);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Manager summary retrieved successfully',
                summary
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to retrieve manager summary'
            );
        }
    };
}
