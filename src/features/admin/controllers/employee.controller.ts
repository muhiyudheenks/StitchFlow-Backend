import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { EmployeeService } from '../services/employee.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

export class EmployeeController {
    private service = new EmployeeService();

    createEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const adminEmail = req.user?.email || 'Admin';
        const employee = await this.service.createEmployee(req.body, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            RESPONSE_MESSAGES.EMPLOYEE_CREATED,
            employee
        );
    });

    getEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const result = await this.service.getEmployees(req.query);
        return res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully.',
            employees: result.employees,
            data: {
                employees: result.employees,
                pagination: result.pagination,
            },
            pagination: result.pagination,
        });
    });

    getEmployeeById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const employee = await this.service.getEmployeeById(id);
        if (!employee) {
            throw AppError.notFound(RESPONSE_MESSAGES.EMPLOYEE_NOT_FOUND);
        }
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Employee details retrieved successfully',
            employee
        );
    });

    updateEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
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
    });

    deleteEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        await this.service.deleteEmployee(id, adminEmail);
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            RESPONSE_MESSAGES.EMPLOYEE_DELETED
        );
    });

    updateStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
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
    });

    resendSetupLink = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
        const { id } = req.params;
        const adminEmail = req.user?.email || 'Admin';
        const result = await this.service.resendSetupLink(id, adminEmail);
        return res.status(200).json({
            success: true,
            message: 'New setup password link generated and sent successfully.',
            data: result,
        });
    });
}
