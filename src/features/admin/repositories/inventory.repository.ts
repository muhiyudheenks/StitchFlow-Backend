import Inventory, { IInventory } from '../models/inventoryModel';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../dto/admin.dto';

export class InventoryRepository {
    async create(dto: CreateInventoryItemDto): Promise<IInventory> {
        const item = new Inventory({
            itemName: dto.itemName,
            category: dto.category || 'General',
            stockQuantity: dto.stockQuantity,
            minStockLevel: dto.minStockLevel,
            unit: dto.unit || 'pcs',
            price: dto.price || 0,
            description: dto.description,
        });
        return await item.save();
    }

    async findById(id: string): Promise<IInventory | null> {
        return await Inventory.findById(id);
    }

    async findAll(filter: any, skip: number, limit: number): Promise<{ items: IInventory[]; total: number }> {
        const [items, total] = await Promise.all([
            Inventory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Inventory.countDocuments(filter),
        ]);
        return { items, total };
    }

    async update(id: string, dto: UpdateInventoryItemDto): Promise<IInventory | null> {
        const item = await Inventory.findById(id);
        if (!item) return null;
        Object.assign(item, dto);
        return await item.save();
    }

    async delete(id: string): Promise<IInventory | null> {
        return await Inventory.findByIdAndDelete(id);
    }

    async adjustStock(id: string, delta: number): Promise<IInventory | null> {
        const item = await Inventory.findById(id);
        if (!item) return null;
        const newQty = item.stockQuantity + delta;
        if (newQty < 0) {
            throw new Error(`Insufficient stock. Current stock: ${item.stockQuantity}, requested reduction: ${Math.abs(delta)}`);
        }
        item.stockQuantity = newQty;
        return await item.save();
    }

    async findLowStock(): Promise<IInventory[]> {
        return await Inventory.find({
            $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
        }).sort({ stockQuantity: 1 });
    }

    async count(filter: any = {}): Promise<number> {
        return await Inventory.countDocuments(filter);
    }

    async aggregateSummary() {
        return await Inventory.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stockQuantity' },
                    totalValuation: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
                },
            },
        ]);
    }
}
