import ProductionLine, { IProductionLine } from '../models/productionLineModel';
import User from '../../auth/models/userModel';
import { CreateProductionLineDto, UpdateProductionLineDto } from '../types/productionLineTypes';

export class ProductionLineRepository {
    async create(dto: CreateProductionLineDto): Promise<IProductionLine> {
        const line = new ProductionLine(dto);
        return await line.save();
    }

    async findAll(filter: any = {}): Promise<IProductionLine[]> {
        return await ProductionLine.find(filter)
            .populate('managerId', 'fullName email department')
            .sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IProductionLine | null> {
        return await ProductionLine.findById(id).populate('managerId', 'fullName email department');
    }

    async update(id: string, dto: UpdateProductionLineDto): Promise<IProductionLine | null> {
        return await ProductionLine.findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true }).populate(
            'managerId',
            'fullName email department'
        );
    }

    async delete(id: string): Promise<IProductionLine | null> {
        return await ProductionLine.findByIdAndDelete(id);
    }

    async getEmployeeCountForLine(lineId: string): Promise<number> {
        return await User.countDocuments({ assignedLine: lineId });
    }

    async getEmployeesForLine(lineId: string) {
        return await User.find({ assignedLine: lineId }).select('fullName email department designation status role');
    }

    async assignEmployeesToLine(lineId: string, employeeIds: string[]): Promise<number> {
        const result = await User.updateMany(
            { _id: { $in: employeeIds } },
            { $set: { assignedLine: lineId } }
        );
        return result.modifiedCount;
    }

    async unassignEmployeesFromLine(lineId: string): Promise<number> {
        const result = await User.updateMany(
            { assignedLine: lineId },
            { $set: { assignedLine: null } }
        );
        return result.modifiedCount;
    }
}
