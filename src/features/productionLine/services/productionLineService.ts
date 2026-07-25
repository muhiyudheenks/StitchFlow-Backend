import { ProductionLineRepository } from '../repositories/productionLineRepository';
import { CreateProductionLineDto, UpdateProductionLineDto, AssignEmployeesDto } from '../types/productionLineTypes';

export class ProductionLineService {
    private repo = new ProductionLineRepository();

    async createLine(dto: CreateProductionLineDto) {
        if (!dto.name || dto.name.trim() === '') {
            throw new Error('Production line name is required');
        }
        const line = await this.repo.create(dto);
        const populated = await this.repo.findById(line._id.toString());
        return populated ? populated.toPublicJSON() : line.toPublicJSON();
    }

    async getAllLines(query: any = {}) {
        const filter: any = {};
        if (query.status && query.status !== 'All') {
            filter.status = query.status.toLowerCase();
        }
        if (query.search && query.search.trim() !== '') {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { description: searchRegex },
            ];
        }

        const lines = await this.repo.findAll(filter);

        const formatted = await Promise.all(
            lines.map(async (line) => {
                const count = await this.repo.getEmployeeCountForLine(line._id.toString());
                const json = line.toPublicJSON();
                return {
                    ...json,
                    activeWorkers: count,
                    employeeCount: count,
                };
            })
        );

        return formatted;
    }

    async getLineById(id: string) {
        const line = await this.repo.findById(id);
        if (!line) {
            throw new Error('Production line not found');
        }
        const count = await this.repo.getEmployeeCountForLine(id);
        const employees = await this.repo.getEmployeesForLine(id);
        return {
            ...line.toPublicJSON(),
            activeWorkers: count,
            employeeCount: count,
            employees: employees.map((emp) => ({
                id: emp._id.toString(),
                fullName: emp.fullName,
                email: emp.email,
                department: emp.department,
                designation: emp.designation,
                status: emp.status,
                role: emp.role,
            })),
        };
    }

    async updateLine(id: string, dto: UpdateProductionLineDto) {
        const line = await this.repo.update(id, dto);
        if (!line) {
            throw new Error('Production line not found');
        }
        const count = await this.repo.getEmployeeCountForLine(id);
        return {
            ...line.toPublicJSON(),
            activeWorkers: count,
            employeeCount: count,
        };
    }

    async deleteLine(id: string) {
        const line = await this.repo.delete(id);
        if (!line) {
            throw new Error('Production line not found');
        }
        await this.repo.unassignEmployeesFromLine(id);
        return { id };
    }

    async assignEmployees(lineId: string, dto: AssignEmployeesDto) {
        const line = await this.repo.findById(lineId);
        if (!line) {
            throw new Error('Production line not found');
        }
        const employeeIds = dto.employeeIds || [];
        const count = await this.repo.assignEmployeesToLine(lineId, employeeIds);
        const totalWorkers = await this.repo.getEmployeeCountForLine(lineId);
        return {
            lineId,
            lineName: line.name,
            assignedCount: count,
            totalWorkers,
        };
    }
}
