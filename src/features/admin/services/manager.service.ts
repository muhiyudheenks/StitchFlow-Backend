import { ManagerRepository } from '../repositories/manager.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { CreateManagerDto, UpdateManagerDto } from '../dto/admin.dto';
import { PaginationQuery } from '../types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../utils/admin.utils';

export class ManagerService {
    private repo = new ManagerRepository();
    private activityRepo = new ActivityRepository();

    async createManager(dto: CreateManagerDto, adminName: string = 'Admin') {
        const existing = await this.repo.findByEmail(dto.email);
        if (existing) {
            if (!existing.isVerified || existing.setupPasswordToken) {
                if (dto.fullName) existing.fullName = dto.fullName;
                if (dto.phone) existing.phone = dto.phone;

                const { resendSetupPasswordToken } = await import('../../../shared/services/invitationService');
                await resendSetupPasswordToken(existing);

                await this.activityRepo.logActivity(
                    adminName,
                    'admin',
                    `Resent setup password link to unverified manager ${existing.fullName}`,
                    'Manager',
                    `Email: ${existing.email}`
                );

                return existing.toPublicJSON();
            }
            throw new Error('Email is already registered');
        }

        const manager = await this.repo.create(dto);
        console.log(`[ManagerService] User document created for ${manager.email} in MongoDB`);

        // Generate setup password token and send invitation email
        try {
            const { resendSetupPasswordToken } = await import('../../../shared/services/invitationService');
            await resendSetupPasswordToken(manager);
        } catch (emailErr: any) {
            console.error(`[ManagerService] Rolling back manager creation for ${manager.email} due to email failure`);
            await this.repo.delete(manager._id.toString());
            throw new Error(`Failed to send invitation email: ${emailErr.message || emailErr}`);
        }

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Created manager ${manager.fullName}`,
            'Manager',
            `Email: ${manager.email}`
        );

        return manager.toPublicJSON();
    }

    async getManagers(query: PaginationQuery) {
        const { page, limit, skip } = getPaginationOptions(query);
        const filter: any = {};

        if (query.search) {
            filter.$or = [
                { fullName: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } },
                { department: { $regex: query.search, $options: 'i' } },
            ];
        }

        const { managers, total } = await this.repo.findAll(filter, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        const result = await Promise.all(
            managers.map(async (m) => {
                const employees = await this.repo.getManagedEmployees(m._id.toString());
                return {
                    ...m.toPublicJSON(),
                    teamSize: employees.length,
                };
            })
        );

        return {
            managers: result,
            pagination: meta,
        };
    }

    async getManagerById(id: string) {
        const manager = await this.repo.findById(id);
        if (!manager) {
            throw new Error('Manager not found');
        }
        const team = await this.repo.getManagedEmployees(id);
        return {
            ...manager.toPublicJSON(),
            team: team.map((e) => e.toPublicJSON()),
        };
    }

    async updateManager(id: string, dto: UpdateManagerDto, adminName: string = 'Admin') {
        const manager = await this.repo.update(id, dto);
        if (!manager) {
            throw new Error('Manager not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Updated manager ${manager.fullName}`,
            'Manager'
        );
        return manager.toPublicJSON();
    }

    async deleteManager(id: string, adminName: string = 'Admin') {
        const manager = await this.repo.delete(id);
        if (!manager) {
            throw new Error('Manager not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Deleted manager ${manager.fullName}`,
            'Manager'
        );
        return { id };
    }

    async assignEmployees(managerId: string, employeeIds: string[], adminName: string = 'Admin') {
        const manager = await this.repo.findById(managerId);
        if (!manager) {
            throw new Error('Manager not found');
        }
        const count = await this.repo.assignEmployeesToManager(managerId, employeeIds);
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Assigned ${count} employees to manager ${manager.fullName}`,
            'Manager'
        );
        return { assignedCount: count };
    }

    async getManagerSummary(managerId: string) {
        const manager = await this.repo.findById(managerId);
        if (!manager) {
            throw new Error('Manager not found');
        }
        const team = await this.repo.getManagedEmployees(managerId);
        return {
            manager: manager.toPublicJSON(),
            teamSize: team.length,
            teamMembers: team.map((t) => ({ id: t._id, fullName: t.fullName, status: t.status })),
        };
    }
}
