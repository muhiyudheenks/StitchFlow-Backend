import { EmployeeRepository } from '../repositories/employee.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto';
import { PaginationQuery } from '../types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../utils/admin.utils';

export class EmployeeService {
    private repo = new EmployeeRepository();
    private activityRepo = new ActivityRepository();

    async createEmployee(dto: CreateEmployeeDto, adminName: string = 'Admin') {
        const existing = await this.repo.findByEmail(dto.email);
        if (existing) {
            if (!existing.isVerified || existing.setupPasswordToken) {
                if (dto.fullName) existing.fullName = dto.fullName;
                if (dto.phone) existing.phone = dto.phone;
                if (dto.employeeType) existing.employeeType = dto.employeeType as any;

                const { resendSetupPasswordToken } = await import('../../../shared/services/invitationService');
                await resendSetupPasswordToken(existing);

                await this.activityRepo.logActivity(
                    adminName,
                    'admin',
                    `Resent setup password link to unverified employee ${existing.fullName}`,
                    'Employee',
                    `Email: ${existing.email}`
                );

                return existing.toPublicJSON();
            }
            throw new Error('Email is already registered');
        }

        const employee = await this.repo.create(dto);
        console.log(`[EmployeeService] User document created for ${employee.email} in MongoDB`);

        // Generate setup password token and send invitation email
        try {
            const { resendSetupPasswordToken } = await import('../../../shared/services/invitationService');
            await resendSetupPasswordToken(employee);
        } catch (emailErr: any) {
            console.error(`[EmployeeService] Rolling back employee creation for ${employee.email} due to email failure`);
            await this.repo.delete(employee._id.toString());
            throw new Error(`Failed to send invitation email: ${emailErr.message || emailErr}`);
        }

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Created employee ${employee.fullName}`,
            'Employee',
            `Email: ${employee.email}`
        );

        return employee.toPublicJSON();
    }

    async resendSetupLink(id: string, adminName: string = 'Admin') {
        const employee = await this.repo.findById(id);
        if (!employee) {
            throw new Error('Employee not found');
        }

        if (employee.isVerified && !employee.setupPasswordToken) {
            throw new Error('Employee account is already activated and verified');
        }

        const { resendSetupPasswordToken } = await import('../../../shared/services/invitationService');
        await resendSetupPasswordToken(employee);

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Resent setup password link to employee ${employee.fullName}`,
            'Employee',
            `ID: ${id}`
        );

        return {
            id: employee._id.toString(),
            email: employee.email,
            fullName: employee.fullName,
            message: 'New setup password link generated and sent successfully.',
        };
    }

    async getEmployees(query: PaginationQuery) {
        const { page, limit, skip } = getPaginationOptions(query);
        const filter: any = {
            role: { $nin: ['admin', 'manager'] },
        };

        if (query.search && query.search.trim() !== '') {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
                { department: searchRegex },
                { designation: searchRegex },
                { employeeType: searchRegex },
            ];
        }

        if (query.status && query.status !== 'All') {
            filter.status = new RegExp(`^${query.status}$`, 'i');
        }

        if (query.department && query.department !== 'All') {
            filter.department = new RegExp(`^${query.department}$`, 'i');
        }

        const { employees, total } = await this.repo.findAll(filter, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        const formattedEmployees = employees.map((e) => {
            const json = e.toPublicJSON();
            const rawStatus = json.status || 'active';
            const formattedStatus =
                rawStatus === 'on_leave'
                    ? 'On Leave'
                    : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

            return {
                id: json.id,
                name: json.fullName,
                fullName: json.fullName,
                email: json.email,
                employeeType: json.employeeType || 'stitching_worker',
                department: json.department || 'Production',
                designation: json.designation || 'Staff',
                role: json.role,
                status: formattedStatus,
                shift: 'Shift A',
                attendanceRate: 96.5,
                isVerified: json.isVerified,
                createdAt: e.createdAt,
            };
        });

        return {
            employees: formattedEmployees,
            pagination: meta,
        };
    }

    async getEmployeeById(id: string) {
        const employee = await this.repo.findById(id);
        if (!employee) {
            throw new Error('Employee not found');
        }
        return employee.toPublicJSON();
    }

    async updateEmployee(id: string, dto: UpdateEmployeeDto, adminName: string = 'Admin') {
        const employee = await this.repo.update(id, dto);
        if (!employee) {
            throw new Error('Employee not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Updated employee ${employee.fullName}`,
            'Employee',
            `ID: ${id}`
        );
        return employee.toPublicJSON();
    }

    async deleteEmployee(id: string, adminName: string = 'Admin') {
        const employee = await this.repo.delete(id);
        if (!employee) {
            throw new Error('Employee not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Deleted employee ${employee.fullName}`,
            'Employee',
            `ID: ${id}`
        );
        return { id };
    }

    async toggleStatus(id: string, status: 'active' | 'inactive' | 'on_leave', adminName: string = 'Admin') {
        const employee = await this.repo.update(id, { status });
        if (!employee) {
            throw new Error('Employee not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Changed status of ${employee.fullName} to ${status}`,
            'Employee'
        );
        return employee.toPublicJSON();
    }
}
