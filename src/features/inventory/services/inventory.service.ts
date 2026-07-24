export class InventoryService {
    async getInventoryItems() {
        return [
            { id: 'inv1', name: 'Heavyweight Indigo Denim Fabric', sku: 'FAB-DNM-001', category: 'Raw Material', stock: 120, reorderLevel: 250, unit: 'Meters', location: 'Warehouse A-12', isLowStock: true },
            { id: 'inv2', name: 'Heavy Duty Brass Zippers (18cm)', sku: 'TRM-ZIP-042', category: 'Trims & Fasteners', stock: 3500, reorderLevel: 1000, unit: 'Pieces', location: 'Storage Bin B-4', isLowStock: false },
            { id: 'inv3', name: 'Polyester Thread Spools (Navy)', sku: 'TRM-THR-882', category: 'Trims', stock: 450, reorderLevel: 200, unit: 'Spools', location: 'Storage Bin B-8', isLowStock: false },
            { id: 'inv4', name: 'Custom Brand Copper Rivets', sku: 'TRM-RVT-109', category: 'Hardware', stock: 150, reorderLevel: 500, unit: 'Units', location: 'Storage Bin C-2', isLowStock: true },
        ];
    }

    async updateStock(id: string, newStock: number) {
        return { id, newStock, updated: true };
    }
}
