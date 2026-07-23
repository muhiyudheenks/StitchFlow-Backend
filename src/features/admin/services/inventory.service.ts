import { InventoryRepository } from '../repositories/inventory.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { CreateInventoryItemDto, UpdateInventoryItemDto, StockAdjustDto } from '../dto/admin.dto';
import { PaginationQuery } from '../types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../utils/admin.utils';

export class InventoryService {
    private repo = new InventoryRepository();
    private activityRepo = new ActivityRepository();

    async createItem(dto: CreateInventoryItemDto, adminName: string = 'Admin') {
        const item = await this.repo.create(dto);
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Created inventory item '${item.itemName}'`,
            'Inventory',
            `Stock: ${item.stockQuantity} ${item.unit}`
        );
        return item;
    }

    async getItems(query: PaginationQuery) {
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

        const { items, total } = await this.repo.findAll(filter, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        return {
            items,
            pagination: meta,
        };
    }

    async getItemById(id: string) {
        const item = await this.repo.findById(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        return item;
    }

    async updateItem(id: string, dto: UpdateInventoryItemDto, adminName: string = 'Admin') {
        const item = await this.repo.update(id, dto);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Updated inventory item '${item.itemName}'`,
            'Inventory'
        );
        return item;
    }

    async deleteItem(id: string, adminName: string = 'Admin') {
        const item = await this.repo.delete(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Deleted inventory item '${item.itemName}'`,
            'Inventory'
        );
        return { id };
    }

    async stockIn(id: string, dto: StockAdjustDto, adminName: string = 'Admin') {
        const item = await this.repo.adjustStock(id, dto.quantity);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Stock In +${dto.quantity} for '${item.itemName}'`,
            'Inventory',
            dto.reason
        );
        return item;
    }

    async stockOut(id: string, dto: StockAdjustDto, adminName: string = 'Admin') {
        const item = await this.repo.adjustStock(id, -dto.quantity);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Stock Out -${dto.quantity} for '${item.itemName}'`,
            'Inventory',
            dto.reason
        );
        return item;
    }

    async getLowStock() {
        return await this.repo.findLowStock();
    }

    async getSummary() {
        const aggregation = await this.repo.aggregateSummary();
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
}
