import * as employeeRepo from '../repositories/employee.repository';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto';
import { resendSetupPasswordToken } from '../../../shared/services/invitationService';
import { AppError } from '../../../shared/errors';
import * as activityRepo from '../../dashboard/repositories/activity.repository';

export async function getEmployees(params: { search?: string; department?: string; status?: string; page?: string | number; limit?: string | number }) {
    const page = Math.max(1, parseInt(params.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit as string, 10) || 10);
    const skip = (page - 1) * limit;

    const { employees, total } = await employeeRepo.findAllEmployees(
        { search: params.search, department: params.department, status: params.status },
        skip,
        limit
    );

    const formatted = employees.map((emp) => emp.toPublicJSON());

    return {
        employees: formatted,
        data: formatted,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
    };
}

export async function getEmployeeById(id: string) {
    const employee = await employeeRepo.findEmployeeById(id);
    if (!employee) throw AppError.notFound('Employee not found');
    return employee.toPublicJSON();
}

export async function createEmployee(dto: CreateEmployeeDto, adminEmail: string = 'Admin') {
    const existing = await employeeRepo.findEmployeeByEmail(dto.email);
    if (existing) {
        if (!existing.isVerified || existing.setupPasswordToken) {
            if (dto.fullName) existing.fullName = dto.fullName;
            if (dto.phone) existing.phone = dto.phone;
            if (dto.employeeType) existing.employeeType = dto.employeeType as any;
            if (dto.designation) existing.designation = dto.designation;
            let emailSent = true;
            let emailError: string | undefined = undefined;
            try {
                await resendSetupPasswordToken(existing);
            } catch (emailErr: any) {
                emailSent = false;
                emailError = emailErr.message || 'Failed to send invitation email';
                console.error(`[AdminEmployeeService] Email re-invitation error for ${existing.email}:`, emailErr);
            }
            return {
                employee: existing.toPublicJSON(),
                emailSent,
                emailError,
            };
        }
        throw AppError.conflict('An account with this email address already exists');
    }

    const newEmployee = await employeeRepo.createEmployeeRepo(dto);

    let emailSent = true;
    let emailError: string | undefined = undefined;

    try {
        await resendSetupPasswordToken(newEmployee);
    } catch (emailErr: any) {
        emailSent = false;
        emailError = emailErr.message || 'Failed to send invitation email';
        console.error(`[AdminEmployeeService] Email invitation error for ${newEmployee.email}:`, emailErr);
    }

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'CREATE_EMPLOYEE',
            'Employee',
            `Created new employee ${newEmployee.fullName} (${newEmployee.email})`
        );
    } catch (actErr) {
        console.error('[AdminEmployeeService] Activity log error:', actErr);
    }

    return {
        employee: newEmployee.toPublicJSON(),
        emailSent,
        emailError,
    };
}

export async function updateEmployee(id: string, dto: UpdateEmployeeDto, adminEmail: string = 'Admin') {
    const updated = await employeeRepo.updateEmployeeRepo(id, dto);
    if (!updated) throw AppError.notFound('Employee not found');

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'UPDATE_EMPLOYEE',
            'Employee',
            `Updated employee ${updated.fullName}`
        );
    } catch (actErr) {
        console.error('[AdminEmployeeService] Activity log error:', actErr);
    }

    return updated.toPublicJSON();
}

export async function deleteEmployee(id: string, adminEmail: string = 'Admin') {
    const deleted = await employeeRepo.deleteEmployeeRepo(id);
    if (!deleted) throw AppError.notFound('Employee not found');

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'DELETE_EMPLOYEE',
            'Employee',
            `Deleted employee ${deleted.fullName} (${deleted.email})`
        );
    } catch (actErr) {
        console.error('[AdminEmployeeService] Activity log error:', actErr);
    }

    return true;
}

export async function resendSetupLink(id: string) {
    const employee = await employeeRepo.findEmployeeById(id);
    if (!employee) throw AppError.notFound('Employee not found');

    if (!employee.password) {
        employee.isVerified = false;
    }

    let emailSent = true;
    let emailError: string | undefined = undefined;
    try {
        await resendSetupPasswordToken(employee);
    } catch (emailErr: any) {
        emailSent = false;
        emailError = emailErr.message || 'Failed to send invitation email';
        console.error(`[AdminEmployeeService] Resend setup link error for ${employee.email}:`, emailErr);
    }

    return { emailSent, emailError };
}

export const adminEmployeeService = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    resendSetupLink,
};
