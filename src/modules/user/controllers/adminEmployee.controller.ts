import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as adminEmployeeService from '../services/adminEmployee.service';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';
import { asyncHandler } from '../../../shared/errors';

export const getEmployees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const result = await adminEmployeeService.getEmployees(req.query as any);
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Employees retrieved successfully',
        data: result.employees,
        employees: result.employees,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});

export const getEmployeeById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const employee = await adminEmployeeService.getEmployeeById(req.params.id);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee details retrieved successfully', employee);
});

export const createEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    const { employee, emailSent, emailError } = await adminEmployeeService.createEmployee(req.body, adminEmail);
    const message = emailSent
        ? 'Employee created successfully. Setup invitation link sent.'
        : 'Employee created successfully, but invitation link email could not be sent.';

    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message,
        data: employee,
        employee,
        emailSent,
        emailError,
    });
});

export const updateEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    const employee = await adminEmployeeService.updateEmployee(req.params.id, req.body, adminEmail);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee details updated successfully', employee);
});

export const deleteEmployee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const adminEmail = req.user?.email || 'Admin';
    await adminEmployeeService.deleteEmployee(req.params.id, adminEmail);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee deleted successfully');
});

export const resendSetupLink = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const result = await adminEmployeeService.resendSetupLink(req.params.id);
    if (!result.emailSent) {
        return res.status(HTTP_STATUS.OK).json({
            success: false,
            emailSent: false,
            message: `Failed to resend setup password link email: ${result.emailError}`,
            error: result.emailError,
        });
    }
    return sendResponse(res, HTTP_STATUS.OK, true, 'Setup password link resent successfully', result);
});
