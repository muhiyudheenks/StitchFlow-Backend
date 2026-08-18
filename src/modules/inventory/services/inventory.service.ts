import FabricItem, { IFabricItem } from '../models/fabric.model';
import ThreadItem, { IThreadItem } from '../models/thread.model';
import GarmentItem, { IGarmentItem } from '../models/garment.model';
import InventoryTransaction, { IInventoryTransaction } from '../models/transaction.model';

export class InventoryService {
    async getInventoryItems() {
        const fabrics = await FabricItem.find().limit(20);
        const threads = await ThreadItem.find().limit(20);
        const garments = await GarmentItem.find().limit(20);

        const fabricMapped = fabrics.map((f) => ({
            id: f._id.toString(),
            _id: f._id.toString(),
            sku: f.fabricId || 'FAB-000',
            name: f.fabricName || 'Fabric Item',
            category: f.fabricType || 'Raw Material',
            quantity: f.currentStock ?? 0,
            stock: f.currentStock ?? 0,
            reorderLevel: f.minimumStock ?? 0,
            minimumStock: f.minimumStock ?? 0,
            unit: f.unit || 'Meters',
            status: (f.currentStock ?? 0) <= (f.minimumStock ?? 0) ? 'low_stock' : 'in_stock',
            location: f.warehouseLocation || 'Main Warehouse',
        }));

        const threadMapped = threads.map((t) => ({
            id: t._id.toString(),
            _id: t._id.toString(),
            sku: t.threadId || 'THR-000',
            name: `${t.threadType || 'Thread'} (${t.brand || 'Brand'})`,
            category: 'Thread / Accessory',
            quantity: t.currentStock ?? 0,
            stock: t.currentStock ?? 0,
            reorderLevel: t.minimumStock ?? 0,
            minimumStock: t.minimumStock ?? 0,
            unit: t.unit || 'Cones',
            status: (t.currentStock ?? 0) <= (t.minimumStock ?? 0) ? 'low_stock' : 'in_stock',
            location: t.warehouse || 'Main Warehouse',
        }));

        const garmentMapped = garments.map((g) => ({
            id: g._id.toString(),
            _id: g._id.toString(),
            sku: g.productId || 'GAR-000',
            name: g.productName || 'Garment Item',
            category: g.category || 'Finished Goods',
            quantity: g.totalQuantity ?? 0,
            stock: g.totalQuantity ?? 0,
            reorderLevel: 50,
            minimumStock: 50,
            unit: 'Pcs',
            status: (g.totalQuantity ?? 0) <= 50 ? 'low_stock' : 'in_stock',
            location: g.warehouse || 'Finished Store',
        }));

        const allItems = [...fabricMapped, ...threadMapped, ...garmentMapped];

        if (allItems.length === 0) {
            return [
                { id: '1', _id: '1', sku: 'FAB-1001', name: 'Heavyweight Indigo Denim Fabric', category: 'Raw Material', quantity: 1450, stock: 1450, reorderLevel: 200, minimumStock: 200, unit: 'Meters', status: 'in_stock', location: 'Warehouse A' },
                { id: '2', _id: '2', sku: 'THR-2044', name: 'Core Spun Polyester Thread - Tex 40', category: 'Thread / Accessory', quantity: 85, stock: 85, reorderLevel: 100, minimumStock: 100, unit: 'Cones', status: 'low_stock', location: 'Rack 4B' },
                { id: '3', _id: '3', sku: 'GAR-5010', name: 'Classic Trucker Jacket (Size M)', category: 'Finished Goods', quantity: 320, stock: 320, reorderLevel: 50, minimumStock: 50, unit: 'Pcs', status: 'in_stock', location: 'Store 1' },
            ];
        }

        return allItems;
    }
    // ==================== FABRIC INVENTORY ====================
    async getFabrics(query: any = {}) {
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '10', 10);
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.search) {
            filter.$or = [
                { fabricId: { $regex: query.search, $options: 'i' } },
                { fabricName: { $regex: query.search, $options: 'i' } },
                { fabricType: { $regex: query.search, $options: 'i' } },
                { color: { $regex: query.search, $options: 'i' } },
                { supplier: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.fabricType && query.fabricType !== 'All') {
            filter.fabricType = query.fabricType;
        }
        if (query.status && query.status !== 'All') {
            filter.status = query.status;
        }

        const total = await FabricItem.countDocuments(filter);
        const fabrics = await FabricItem.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            fabrics,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async createFabric(data: Partial<IFabricItem>, userName: string = 'Admin') {
        const count = await FabricItem.countDocuments();
        const fabricId = data.fabricId || `FAB-${1001 + count}`;
        
        const fabric = new FabricItem({
            ...data,
            fabricId,
        });

        await fabric.save();

        // Auto log transaction
        await InventoryTransaction.create({
            item: `${fabric.fabricName} (${fabric.fabricId})`,
            itemType: 'Fabric',
            quantity: fabric.currentStock,
            movementType: 'Purchase',
            user: userName,
            notes: `Initial fabric entry: ${fabric.currentStock} ${fabric.unit}`,
        });

        return fabric;
    }

    async updateFabric(id: string, data: Partial<IFabricItem>, userName: string = 'Admin') {
        const fabric = await FabricItem.findById(id);
        if (!fabric) {
            throw new Error('Fabric item not found');
        }

        const prevStock = fabric.currentStock;
        Object.assign(fabric, data);
        await fabric.save();

        const stockDiff = fabric.currentStock - prevStock;
        if (stockDiff !== 0) {
            await InventoryTransaction.create({
                item: `${fabric.fabricName} (${fabric.fabricId})`,
                itemType: 'Fabric',
                quantity: stockDiff,
                movementType: stockDiff > 0 ? 'Purchase' : 'Adjustment',
                user: userName,
                notes: `Stock updated from ${prevStock} to ${fabric.currentStock} ${fabric.unit}`,
            });
        }

        return fabric;
    }

    async deleteFabric(id: string, userName: string = 'Admin') {
        const fabric = await FabricItem.findByIdAndDelete(id);
        if (!fabric) {
            throw new Error('Fabric item not found');
        }

        await InventoryTransaction.create({
            item: `${fabric.fabricName} (${fabric.fabricId})`,
            itemType: 'Fabric',
            quantity: -fabric.currentStock,
            movementType: 'Adjustment',
            user: userName,
            notes: `Fabric item deleted from inventory`,
        });

        return fabric;
    }

    // ==================== THREAD INVENTORY ====================
    async getThreads(query: any = {}) {
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '10', 10);
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.search) {
            filter.$or = [
                { threadId: { $regex: query.search, $options: 'i' } },
                { threadType: { $regex: query.search, $options: 'i' } },
                { brand: { $regex: query.search, $options: 'i' } },
                { color: { $regex: query.search, $options: 'i' } },
                { supplier: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.threadType && query.threadType !== 'All') {
            filter.threadType = query.threadType;
        }
        if (query.status && query.status !== 'All') {
            filter.status = query.status;
        }

        const total = await ThreadItem.countDocuments(filter);
        const threads = await ThreadItem.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            threads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async createThread(data: Partial<IThreadItem>, userName: string = 'Admin') {
        const count = await ThreadItem.countDocuments();
        const threadId = data.threadId || `THR-${1001 + count}`;

        const thread = new ThreadItem({
            ...data,
            threadId,
        });

        await thread.save();

        await InventoryTransaction.create({
            item: `${thread.threadType} - ${thread.brand} (${thread.threadId})`,
            itemType: 'Thread',
            quantity: thread.currentStock,
            movementType: 'Purchase',
            user: userName,
            notes: `Initial thread entry: ${thread.currentStock} ${thread.unit}`,
        });

        return thread;
    }

    async updateThread(id: string, data: Partial<IThreadItem>, userName: string = 'Admin') {
        const thread = await ThreadItem.findById(id);
        if (!thread) {
            throw new Error('Thread item not found');
        }

        const prevStock = thread.currentStock;
        Object.assign(thread, data);
        await thread.save();

        const stockDiff = thread.currentStock - prevStock;
        if (stockDiff !== 0) {
            await InventoryTransaction.create({
                item: `${thread.threadType} - ${thread.brand} (${thread.threadId})`,
                itemType: 'Thread',
                quantity: stockDiff,
                movementType: stockDiff > 0 ? 'Purchase' : 'Adjustment',
                user: userName,
                notes: `Stock updated from ${prevStock} to ${thread.currentStock} ${thread.unit}`,
            });
        }

        return thread;
    }

    async deleteThread(id: string, userName: string = 'Admin') {
        const thread = await ThreadItem.findByIdAndDelete(id);
        if (!thread) {
            throw new Error('Thread item not found');
        }

        await InventoryTransaction.create({
            item: `${thread.threadType} - ${thread.brand} (${thread.threadId})`,
            itemType: 'Thread',
            quantity: -thread.currentStock,
            movementType: 'Adjustment',
            user: userName,
            notes: `Thread item deleted from inventory`,
        });

        return thread;
    }

    // ==================== FINISHED GARMENTS INVENTORY ====================
    async getGarments(query: any = {}) {
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '10', 10);
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.search) {
            filter.$or = [
                { productId: { $regex: query.search, $options: 'i' } },
                { productName: { $regex: query.search, $options: 'i' } },
                { styleNumber: { $regex: query.search, $options: 'i' } },
                { category: { $regex: query.search, $options: 'i' } },
                { color: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.category && query.category !== 'All') {
            filter.category = query.category;
        }
        if (query.size && query.size !== 'All') {
            filter.size = query.size;
        }
        if (query.status && query.status !== 'All') {
            filter.status = query.status;
        }

        const total = await GarmentItem.countDocuments(filter);
        const garments = await GarmentItem.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            garments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async createGarment(data: Partial<IGarmentItem>, userName: string = 'Admin') {
        const count = await GarmentItem.countDocuments();
        const productId = data.productId || `PRD-${1001 + count}`;

        const garment = new GarmentItem({
            ...data,
            productId,
        });

        await garment.save();

        await InventoryTransaction.create({
            item: `${garment.productName} (${garment.productId})`,
            itemType: 'Finished Garment',
            quantity: garment.totalQuantity,
            movementType: 'Production',
            user: userName,
            notes: `New finished garment batch logged: ${garment.totalQuantity} Units`,
        });

        return garment;
    }

    async updateGarment(id: string, data: Partial<IGarmentItem>, userName: string = 'Admin') {
        const garment = await GarmentItem.findById(id);
        if (!garment) {
            throw new Error('Finished garment product not found');
        }

        const prevTotal = garment.totalQuantity;
        Object.assign(garment, data);
        await garment.save();

        const diff = garment.totalQuantity - prevTotal;
        if (diff !== 0) {
            await InventoryTransaction.create({
                item: `${garment.productName} (${garment.productId})`,
                itemType: 'Finished Garment',
                quantity: diff,
                movementType: diff > 0 ? 'Production' : 'Adjustment',
                user: userName,
                notes: `Finished garment stock updated to ${garment.totalQuantity} Units`,
            });
        }

        return garment;
    }

    async deleteGarment(id: string, userName: string = 'Admin') {
        const garment = await GarmentItem.findByIdAndDelete(id);
        if (!garment) {
            throw new Error('Finished garment product not found');
        }

        await InventoryTransaction.create({
            item: `${garment.productName} (${garment.productId})`,
            itemType: 'Finished Garment',
            quantity: -garment.totalQuantity,
            movementType: 'Adjustment',
            user: userName,
            notes: `Garment product removed from inventory`,
        });

        return garment;
    }

    // ==================== INVENTORY SUMMARY & ANALYTICS ====================
    async getInventorySummary() {
        const fabrics = await FabricItem.find();
        const threads = await ThreadItem.find();
        const garments = await GarmentItem.find();

        const totalFabricStock = fabrics.reduce((sum, item) => sum + item.currentStock, 0);
        const totalThreadStock = threads.reduce((sum, item) => sum + item.currentStock, 0);
        const finishedGarmentsCount = garments.reduce((sum, item) => sum + item.totalQuantity, 0);

        const fabricLowStockCount = fabrics.filter((f) => f.status === 'Low Stock' || f.status === 'Out of Stock').length;
        const threadLowStockCount = threads.filter((t) => t.status === 'Low Stock' || t.status === 'Out of Stock').length;
        const lowStockItemsCount = fabricLowStockCount + threadLowStockCount;

        const totalFabricValue = fabrics.reduce((sum, item) => sum + (item.totalValue || item.currentStock * item.unitCost), 0);
        const totalThreadValue = threads.reduce((sum, item) => sum + (item.totalValue || item.currentStock * item.unitCost), 0);
        const totalGarmentValue = garments.reduce((sum, item) => sum + (item.totalQuantity * item.unitCost), 0);

        const inventoryValue = Number((totalFabricValue + totalThreadValue + totalGarmentValue).toFixed(2));

        return {
            totalFabricStock,
            totalThreadStock,
            finishedGarmentsCount,
            lowStockItemsCount,
            inventoryValue,
        };
    }

    async getInventoryAnalytics() {
        const summary = await this.getInventorySummary();
        const transactions = await InventoryTransaction.find().sort({ createdAt: -1 }).limit(100);

        const fabricConsumption = transactions
            .filter((t) => t.itemType === 'Fabric' && t.quantity < 0)
            .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

        const threadConsumption = transactions
            .filter((t) => t.itemType === 'Thread' && t.quantity < 0)
            .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

        const finishedProduction = transactions
            .filter((t) => t.itemType === 'Finished Garment' && t.movementType === 'Production')
            .reduce((sum, t) => sum + t.quantity, 0);

        return {
            fabricConsumption,
            threadConsumption,
            finishedProduction,
            lowStockCount: summary.lowStockItemsCount,
        };
    }

    // ==================== INVENTORY TRANSACTIONS ====================
    async getTransactions(query: any = {}) {
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '20', 10);
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.movementType && query.movementType !== 'All') {
            filter.movementType = query.movementType;
        }

        const total = await InventoryTransaction.countDocuments(filter);
        const transactions = await InventoryTransaction.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }
}
