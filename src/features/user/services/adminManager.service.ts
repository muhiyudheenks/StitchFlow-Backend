import { ManagerRepository } from '../repositories/manager.repository';
import { CreateManagerDto, UpdateManagerDto } from '../dto/admin.dto';
import { resendSetupPasswordToken } from '../../../shared/services/invitationService';
import { AppError } from '../../../shared/errors';
import { ActivityRepository } from '../../dashboard/repositories/activity.repository';

export class AdminManagerService {
    private repo = new ManagerRepository();
    private activityRepo = new ActivityRepository();

    async getManagers(params: { search?: string; department?: string; page?: string | number; limit?: string | number }) {
        const page = Math.max(1, parseInt(params.page as string, 10) || 1);
        const limit = Math.max(1, parseInt(params.limit as string, 10) || 10);
        const skip = (page - 1) * limit;

        const { managers, total } = await this.repo.findAll(
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

    async getManagerById(id: string) {
        const manager = await this.repo.findById(id);
        if (!manager) throw AppError.notFound('Manager not found');
        return manager.toPublicJSON();
    }

    async createManager(dto: CreateManagerDto, adminEmail: string = 'Admin') {
        const existing = await this.repo.findByEmail(dto.email);
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

        const newManager = await this.repo.create(dto);

        try {
            await resendSetupPasswordToken(newManager);
        } catch (emailErr: any) {
            console.error(`[AdminManagerService] Email invitation error for ${newManager.email}:`, emailErr);
        }

        try {
            await this.activityRepo.logActivity(
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

    async updateManager(id: string, dto: UpdateManagerDto, adminEmail: string = 'Admin') {
        const updated = await this.repo.update(id, dto);
        if (!updated) throw AppError.notFound('Manager not found');

        try {
            await this.activityRepo.logActivity(
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

    async deleteManager(id: string, adminEmail: string = 'Admin') {
        const deleted = await this.repo.delete(id);
        if (!deleted) throw AppError.notFound('Manager not found');

        try {
            await this.activityRepo.logActivity(
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

    async assignEmployees(managerId: string, employeeIds: string[]) {
        const manager = await this.repo.findById(managerId);
        if (!manager) throw AppError.notFound('Manager not found');

        const count = await this.repo.assignEmployeesToManager(managerId, employeeIds);
        return { assignedCount: count };
    }

    async resendSetupLink(id: string) {
        const manager = await this.repo.findById(id);
        if (!manager) throw AppError.notFound('Manager not found');

        await resendSetupPasswordToken(manager);
        return true;
    }
}
