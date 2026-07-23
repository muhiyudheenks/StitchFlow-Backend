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
            throw new Error('Email is already registered');
        }
        const employee = await this.repo.create(dto);
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Created employee ${employee.fullName}`,
            'Employee',
            `Email: ${employee.email}`
        );
        return employee.toPublicJSON();
    }

    async getEmployees(query: PaginationQuery) {
        const { page, limit, skip } = getPaginationOptions(query);
        const filter: any = {};

        if (query.search) {
            filter.$or = [
                { fullName: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } },
                { department: { $regex: query.search, $options: 'i' } },
            ];
        }

        if (query.status) {
            filter.status = query.status;
        }

        if (query.department) {
            filter.department = query.department;
        }

        const { employees, total } = await this.repo.findAll(filter, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        return {
            employees: employees.map((e) => e.toPublicJSON()),
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
