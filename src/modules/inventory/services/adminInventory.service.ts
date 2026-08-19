import * as repo from '../repositories/inventory.repository';
import * as activityRepo from '../../dashboard/repositories/activity.repository';
import { CreateInventoryItemDto, UpdateInventoryItemDto, StockAdjustDto } from '../../user/dto/admin.dto';
import { PaginationQuery } from '../../user/types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../../user/utils/admin.utils';

export async function createItem(dto: CreateInventoryItemDto, adminName: string = 'Admin') {
    const item = await repo.createInventoryRepo(dto);
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Created inventory item '${item.itemName}'`,
        'Inventory',
        `Stock: ${item.stockQuantity} ${item.unit}`
    );
    return item;
}

export async function getItems(query: PaginationQuery) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter: any = {};

    if (query.search) {
        filter.$or = [
            { itemName: { $regex: query.search, $options: 'i' } },
            { category: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.status) {
        filter.status = query.status;
    }

    const { items, total } = await repo.findAllInventory(filter, skip, limit);
    const meta = buildPaginationMeta(total, page, limit);

    return {
        items,
        pagination: meta,
    };
}

export async function getItemById(id: string) {
    const item = await repo.findInventoryById(id);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    return item;
}

export async function updateItem(id: string, dto: UpdateInventoryItemDto, adminName: string = 'Admin') {
    const item = await repo.updateInventoryRepo(id, dto);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Updated inventory item '${item.itemName}'`,
        'Inventory'
    );
    return item;
}

export async function deleteItem(id: string, adminName: string = 'Admin') {
    const item = await repo.deleteInventoryRepo(id);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Deleted inventory item '${item.itemName}'`,
        'Inventory'
    );
    return { id };
}

export async function stockIn(id: string, dto: StockAdjustDto, adminName: string = 'Admin') {
    const item = await repo.adjustInventoryStock(id, dto.quantity);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Stock In +${dto.quantity} for '${item.itemName}'`,
        'Inventory',
        dto.reason
    );
    return item;
}

export async function stockOut(id: string, dto: StockAdjustDto, adminName: string = 'Admin') {
    const item = await repo.adjustInventoryStock(id, -dto.quantity);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Stock Out -${dto.quantity} for '${item.itemName}'`,
        'Inventory',
        dto.reason
    );
    return item;
}

export async function getLowStock() {
    return await repo.findLowStock();
}

export async function getSummary() {
    const aggregation = await repo.aggregateSummary();
    let totalItems = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    aggregation.forEach((stat) => {
        totalItems += stat.count;
        totalValuation += stat.totalValuation;
        if (stat._id === 'in_stock') inStock = stat.count;
        if (stat._id === 'low_stock') lowStock = stat.count;
        if (stat._id === 'out_of_stock') outOfStock = stat.count;
    });

    return {
        totalItems,
        inStock,
        lowStock,
        outOfStock,
        totalValuation,
    };
}

export const adminInventoryService = {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    stockIn,
    stockOut,
    getLowStock,
    getSummary,
};
