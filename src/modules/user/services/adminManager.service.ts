import * as managerRepo from '../repositories/manager.repository';
import { CreateManagerDto, UpdateManagerDto } from '../dto/admin.dto';
import { resendSetupPasswordToken } from '../../../shared/services/invitationService';
import { AppError } from '../../../shared/errors';
import * as activityRepo from '../../dashboard/repositories/activity.repository';

export async function getManagers(params: { search?: string; department?: string; page?: string | number; limit?: string | number }) {
    const page = Math.max(1, parseInt(params.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit as string, 10) || 10);
    const skip = (page - 1) * limit;

    const { managers, total } = await managerRepo.findAllManagers(
        { search: params.search, department: params.department },
        skip,
        limit
    );

    const formatted = managers.map((m) => m.toPublicJSON());

    return {
        managers: formatted,
        data: formatted,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
    };
}

export async function getManagerById(id: string) {
    const manager = await managerRepo.findManagerById(id);
    if (!manager) throw AppError.notFound('Manager not found');
    return manager.toPublicJSON();
}

export async function createManager(dto: CreateManagerDto, adminEmail: string = 'Admin') {
    const existing = await managerRepo.findManagerByEmail(dto.email);
    if (existing) {
        if (!existing.isVerified || existing.setupPasswordToken) {
            if (dto.fullName) existing.fullName = dto.fullName;
            if (dto.phone) existing.phone = dto.phone;
            if (dto.designation) existing.designation = dto.designation;
            await resendSetupPasswordToken(existing);
            return existing.toPublicJSON();
        }
        throw AppError.conflict('An account with this email address already exists');
    }

    const newManager = await managerRepo.createManagerRepo(dto);

    try {
        await resendSetupPasswordToken(newManager);
    } catch (emailErr: any) {
        console.error(`[AdminManagerService] Email invitation error for ${newManager.email}:`, emailErr);
    }

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'CREATE_MANAGER',
            'Manager',
            `Created new manager ${newManager.fullName} (${newManager.email})`
        );
    } catch (actErr) {
        console.error('[AdminManagerService] Activity log error:', actErr);
    }

    return newManager.toPublicJSON();
}

export async function updateManager(id: string, dto: UpdateManagerDto, adminEmail: string = 'Admin') {
    const updated = await managerRepo.updateManagerRepo(id, dto);
    if (!updated) throw AppError.notFound('Manager not found');

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'UPDATE_MANAGER',
            'Manager',
            `Updated manager ${updated.fullName}`
        );
    } catch (actErr) {
        console.error('[AdminManagerService] Activity log error:', actErr);
    }

    return updated.toPublicJSON();
}

export async function deleteManager(id: string, adminEmail: string = 'Admin') {
    const deleted = await managerRepo.deleteManagerRepo(id);
    if (!deleted) throw AppError.notFound('Manager not found');

    try {
        await activityRepo.logActivity(
            adminEmail,
            'Admin',
            'DELETE_MANAGER',
            'Manager',
            `Deleted manager ${deleted.fullName} (${deleted.email})`
        );
    } catch (actErr) {
        console.error('[AdminManagerService] Activity log error:', actErr);
    }

    return true;
}

export async function assignEmployees(managerId: string, employeeIds: string[]) {
    const manager = await managerRepo.findManagerById(managerId);
    if (!manager) throw AppError.notFound('Manager not found');

    const count = await managerRepo.assignEmployeesToManager(managerId, employeeIds);
    return { assignedCount: count };
}

export async function resendSetupLink(id: string) {
    const manager = await managerRepo.findManagerById(id);
    if (!manager) throw AppError.notFound('Manager not found');

    await resendSetupPasswordToken(manager);
    return true;
}

export const adminManagerService = {
    getManagers,
    getManagerById,
    createManager,
    updateManager,
    deleteManager,
    assignEmployees,
    resendSetupLink,
};
