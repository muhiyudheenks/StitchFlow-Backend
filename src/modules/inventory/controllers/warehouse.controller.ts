import { Request, Response } from 'express';
import Warehouse from '../models/warehouse.model';
import GarmentItem from '../models/garment.model';
import FabricItem from '../models/fabric.model';
import ThreadItem from '../models/thread.model';

export async function getWarehouses(req: Request, res: Response) {
    try {
        const warehouses = await Warehouse.find().sort({ name: 1 });
        return res.status(200).json({
            success: true,
            data: warehouses,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch warehouses',
        });
    }
}

export async function createWarehouse(req: Request, res: Response) {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Warehouse name is required',
            });
        }

        const cleanName = name.trim();
        const existing = await Warehouse.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Warehouse with this name already exists',
            });
        }

        const warehouse = await Warehouse.create({ name: cleanName });
        return res.status(201).json({
            success: true,
            message: 'Warehouse created successfully',
            data: warehouse,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create warehouse',
        });
    }
}

export async function deleteWarehouse(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findById(id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found',
            });
        }

        // Check if any garments, fabrics, or threads are using this warehouse location
        const garmentInUse = await GarmentItem.exists({ warehouse: warehouse.name });
        const fabricInUse = await FabricItem.exists({ warehouseLocation: warehouse.name });
        const threadInUse = await ThreadItem.exists({ warehouse: warehouse.name });

        if (garmentInUse || fabricInUse || threadInUse) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete warehouse '${warehouse.name}' because it is assigned to existing inventory items.`,
            });
        }

        await Warehouse.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: `Warehouse '${warehouse.name}' deleted successfully`,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete warehouse',
        });
    }
}
