import Inventory, { IInventory } from '../models/adminInventory.model';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../../user/dto/admin.dto';

export async function createInventoryRepo(dto: CreateInventoryItemDto): Promise<IInventory> {
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

export async function findInventoryById(id: string): Promise<IInventory | null> {
    return await Inventory.findById(id);
}

export async function findAllInventory(filter: any, skip: number, limit: number): Promise<{ items: IInventory[]; total: number }> {
    const [items, total] = await Promise.all([
        Inventory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Inventory.countDocuments(filter),
    ]);
    return { items, total };
}

export async function updateInventoryRepo(id: string, dto: UpdateInventoryItemDto): Promise<IInventory | null> {
    const item = await Inventory.findById(id);
    if (!item) return null;
    Object.assign(item, dto);
    return await item.save();
}

export async function deleteInventoryRepo(id: string): Promise<IInventory | null> {
    return await Inventory.findByIdAndDelete(id);
}

export async function adjustInventoryStock(id: string, delta: number): Promise<IInventory | null> {
    const item = await Inventory.findById(id);
    if (!item) return null;
    const newQty = item.stockQuantity + delta;
    if (newQty < 0) {
        throw new Error(`Insufficient stock. Current stock: ${item.stockQuantity}, requested reduction: ${Math.abs(delta)}`);
    }
    item.stockQuantity = newQty;
    return await item.save();
}

export async function findLowStockInventory(): Promise<IInventory[]> {
    return await Inventory.find({
        $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
    }).sort({ stockQuantity: 1 });
}

export async function countInventory(filter: any = {}): Promise<number> {
    return await Inventory.countDocuments(filter);
}

export async function aggregateInventorySummary() {
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

export const inventoryRepository = {
    create: createInventoryRepo,
    findById: findInventoryById,
    findAll: findAllInventory,
    update: updateInventoryRepo,
    delete: deleteInventoryRepo,
    adjustStock: adjustInventoryStock,
    findLowStock: findLowStockInventory,
    count: countInventory,
    aggregateSummary: aggregateInventorySummary,
};
