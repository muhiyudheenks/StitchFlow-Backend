import Production, { IProduction } from '../models/production.model';
import { CreateProductionDto, UpdateProductionDto } from '../../user/dto/admin.dto';

export class ProductionRepository {
    async create(dto: CreateProductionDto): Promise<IProduction> {
        const production = new Production({
            title: dto.title,
            targetQuantity: dto.targetQuantity,
            completedQuantity: dto.completedQuantity || 0,
            status: dto.status || 'pending',
            managerId: dto.managerId || null,
            startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            notes: dto.notes,
        });
        return await production.save();
    }

    async findById(id: string): Promise<IProduction | null> {
        return await Production.findById(id).populate('managerId', 'fullName email department');
    }

    async findAll(filter: any, skip: number, limit: number): Promise<{ productions: IProduction[]; total: number }> {
        const [productions, total] = await Promise.all([
            Production.find(filter)
                .populate('managerId', 'fullName email department')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Production.countDocuments(filter),
        ]);
        return { productions, total };
    }

    async update(id: string, dto: UpdateProductionDto): Promise<IProduction | null> {
        return await Production.findByIdAndUpdate(
            id,
            { $set: dto },
            { new: true, runValidators: true }
        ).populate('managerId', 'fullName email department');
    }

    async delete(id: string): Promise<IProduction | null> {
        return await Production.findByIdAndDelete(id);
    }

    async findTodayProduction(): Promise<IProduction[]> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await Production.find({
            $or: [
                { startDate: { $gte: startOfDay, $lte: endOfDay } },
                { status: 'in_progress' },
            ],
        }).populate('managerId', 'fullName email department');
    }

    async count(filter: any = {}): Promise<number> {
        return await Production.countDocuments(filter);
    }

    async aggregateStats(filter: any = {}) {
        return await Production.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalTarget: { $sum: '$targetQuantity' },
                    totalCompleted: { $sum: '$completedQuantity' },
                    totalCount: { $sum: 1 },
                },
            },
        ]);
    }

    async aggregateTodayStats() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const stats = await Production.aggregate([
            {
                $match: {
                    $or: [
                        { startDate: { $gte: startOfDay, $lte: endOfDay } },
                        { status: 'in_progress' },
                    ],
                },
            },
            {
                $group: {
                    _id: null,
                    todayTarget: { $sum: '$targetQuantity' },
                    todayCompleted: { $sum: '$completedQuantity' },
                },
            },
        ]);

        return stats[0] || { todayTarget: 0, todayCompleted: 0 };
    }
}
