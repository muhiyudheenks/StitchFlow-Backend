import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { EmployeeService } from '../services/employee.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';

export class EmployeeController {
    private service = new EmployeeService();

    createEmployee = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const adminEmail = req.user?.email || 'Admin';
            const employee = await this.service.createEmployee(req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.CREATED,
                true,
                RESPONSE_MESSAGES.EMPLOYEE_CREATED,
                employee
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to create employee'
            );
        }
    };

    getEmployees = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const result = await this.service.getEmployees(req.query);
            return res.status(200).json({
                success: true,
                message: 'Employees retrieved successfully.',
                employees: result.employees,
                data: result.employees,
                pagination: result.pagination,
            });
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                false,
                error.message || 'Failed to retrieve employees'
            );
        }
    };

    getEmployeeById = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const employee = await this.service.getEmployeeById(id);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                'Employee details retrieved successfully',
                employee
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.NOT_FOUND,
                false,
                error.message || RESPONSE_MESSAGES.EMPLOYEE_NOT_FOUND
            );
        }
    };

    updateEmployee = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            const updated = await this.service.updateEmployee(id, req.body, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.EMPLOYEE_UPDATED,
                updated
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to update employee'
            );
        }
    };

    deleteEmployee = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            await this.service.deleteEmployee(id, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.EMPLOYEE_DELETED
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to delete employee'
            );
        }
    };

    updateStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const adminEmail = req.user?.email || 'Admin';
            const updated = await this.service.toggleStatus(id, status, adminEmail);
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                true,
                RESPONSE_MESSAGES.EMPLOYEE_STATUS_UPDATED,
                updated
            );
        } catch (error: any) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                error.message || 'Failed to update status'
            );
        }
    };

    resendSetupLink = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const adminEmail = req.user?.email || 'Admin';
            const result = await this.service.resendSetupLink(id, adminEmail);
            return res.status(200).json({
                success: true,
                message: 'New setup password link generated and sent successfully.',
                data: result,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to resend setup password link',
            });
        }
    };
}
