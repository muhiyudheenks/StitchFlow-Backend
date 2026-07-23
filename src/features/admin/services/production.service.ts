import { ProductionRepository } from '../repositories/production.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { CreateProductionDto, UpdateProductionDto } from '../dto/admin.dto';
import { PaginationQuery } from '../types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../utils/admin.utils';

export class ProductionService {
    private repo = new ProductionRepository();
    private activityRepo = new ActivityRepository();

    async createProduction(dto: CreateProductionDto, adminName: string = 'Admin') {
        const production = await this.repo.create(dto);
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Created production task '${production.title}'`,
            'Production',
            `Target: ${production.targetQuantity}`
        );
        return production;
    }

    async getProductions(query: PaginationQuery) {
        const { page, limit, skip } = getPaginationOptions(query);
        const filter: any = {};

        if (query.search) {
            filter.title = { $regex: query.search, $options: 'i' };
        }

        if (query.status) {
            filter.status = query.status;
        }

        const { productions, total } = await this.repo.findAll(filter, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        return {
            productions,
            pagination: meta,
        };
    }

    async getProductionById(id: string) {
        const production = await this.repo.findById(id);
        if (!production) {
            throw new Error('Production task not found');
        }
        return production;
    }

    async updateProduction(id: string, dto: UpdateProductionDto, adminName: string = 'Admin') {
        const production = await this.repo.update(id, dto);
        if (!production) {
            throw new Error('Production task not found');
        }

        // Auto-update status to completed if completedQuantity >= targetQuantity
        if (production.completedQuantity >= production.targetQuantity && production.status !== 'completed') {
            production.status = 'completed';
            await production.save();
        }

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Updated production task '${production.title}'`,
            'Production'
        );
        return production;
    }

    async deleteProduction(id: string, adminName: string = 'Admin') {
        const production = await this.repo.delete(id);
        if (!production) {
            throw new Error('Production task not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Deleted production task '${production.title}'`,
            'Production'
        );
        return { id };
    }

    async getTodayProduction() {
        return await this.repo.findTodayProduction();
    }

    async getTarget() {
        const stats = await this.repo.aggregateStats();
        const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
        return { totalTarget };
    }

    async getCompleted() {
        const stats = await this.repo.aggregateStats();
        const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
        return { totalCompleted };
    }

    async getRemaining() {
        const stats = await this.repo.aggregateStats();
        const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
        const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
        return { totalRemaining: Math.max(0, totalTarget - totalCompleted) };
    }

    async getEfficiency() {
        const stats = await this.repo.aggregateStats();
        const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
        const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
        const efficiency = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;
        return {
            totalTarget,
            totalCompleted,
            efficiencyPercentage: efficiency,
        };
    }
}
