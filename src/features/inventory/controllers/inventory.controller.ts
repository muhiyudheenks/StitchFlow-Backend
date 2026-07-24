import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { InventoryService } from '../services/inventory.service';

const inventoryService = new InventoryService();

export const getInventoryItems = async (req: AuthRequest, res: Response) => {
    try {
        const items = await inventoryService.getInventoryItems();
        return res.status(200).json({ success: true, message: 'Inventory items retrieved', data: items });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateStock = async (req: AuthRequest, res: Response) => {
    try {
        const { stock } = req.body;
        const result = await inventoryService.updateStock(req.params.id, stock);
        return res.status(200).json({ success: true, message: 'Inventory stock updated', data: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
