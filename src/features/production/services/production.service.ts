import ProductionBatch from '../models/productionBatchModel';

export class ProductionService {
    async getProductionBatches() {
        const batches = await ProductionBatch.find().sort({ createdAt: -1 });
        if (batches.length === 0) {
            return [
                { id: 'pb1', batchNumber: 'BT-9042', productName: 'Men Outerwear Denim Jacket', targetQuantity: 1800, completedQuantity: 1420, line: 'Assembly Line A', status: 'in_production', dueDate: '2026-07-28' },
                { id: 'pb2', batchNumber: 'BT-9043', productName: 'Women Cotton Chino Pants', targetQuantity: 2500, completedQuantity: 2500, line: 'Cutting & Laying', status: 'completed', dueDate: '2026-07-22' },
                { id: 'pb3', batchNumber: 'BT-9044', productName: 'Heavyweight Workwear Vest', targetQuantity: 1200, completedQuantity: 450, line: 'Quality Control Line', status: 'quality_check', dueDate: '2026-07-30' },
            ];
        }
        return batches.map((b) => ({
            id: b._id.toString(),
            batchNumber: b.batchNumber,
            productName: b.productName,
            targetQuantity: b.targetQuantity,
            completedQuantity: b.completedQuantity,
            line: b.line,
            status: b.status,
            dueDate: b.dueDate ? b.dueDate.toISOString().split('T')[0] : 'N/A',
        }));
    }

    async createProductionBatch(data: any, createdBy: string) {
        return await ProductionBatch.create({
            batchNumber: data.batchNumber || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
            productName: data.productName,
            targetQuantity: data.targetQuantity,
            completedQuantity: 0,
            line: data.line || 'Assembly Line A',
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            status: 'planned',
            createdBy,
        });
    }

    async updateProductionBatch(id: string, updateData: any) {
        return await ProductionBatch.findByIdAndUpdate(id, updateData, { new: true });
    }
}
