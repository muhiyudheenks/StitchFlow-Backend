import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

const service = new InventoryService();

export class InventoryController {
    // Fabric
    getFabrics = async (req: Request, res: Response): Promise<Response> => {
        try {
            const data = await service.getFabrics(req.query);
            return res.status(200).json({ success: true, message: 'Fabric inventory retrieved', data: data.fabrics, pagination: data.pagination });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve fabric inventory' });
        }
    };

    createFabric = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const fabric = await service.createFabric(req.body, user);
            return res.status(201).json({ success: true, message: 'Fabric item created successfully', data: fabric });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to create fabric item' });
        }
    };

    updateFabric = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const fabric = await service.updateFabric(req.params.id, req.body, user);
            return res.status(200).json({ success: true, message: 'Fabric item updated successfully', data: fabric });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to update fabric item' });
        }
    };

    deleteFabric = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const fabric = await service.deleteFabric(req.params.id, user);
            return res.status(200).json({ success: true, message: 'Fabric item deleted successfully', data: fabric });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to delete fabric item' });
        }
    };

    // Thread
    getThreads = async (req: Request, res: Response): Promise<Response> => {
        try {
            const data = await service.getThreads(req.query);
            return res.status(200).json({ success: true, message: 'Thread inventory retrieved', data: data.threads, pagination: data.pagination });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve thread inventory' });
        }
    };

    createThread = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const thread = await service.createThread(req.body, user);
            return res.status(201).json({ success: true, message: 'Thread item created successfully', data: thread });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to create thread item' });
        }
    };

    updateThread = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const thread = await service.updateThread(req.params.id, req.body, user);
            return res.status(200).json({ success: true, message: 'Thread item updated successfully', data: thread });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to update thread item' });
        }
    };

    deleteThread = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const thread = await service.deleteThread(req.params.id, user);
            return res.status(200).json({ success: true, message: 'Thread item deleted successfully', data: thread });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to delete thread item' });
        }
    };

    // Finished Garments
    getGarments = async (req: Request, res: Response): Promise<Response> => {
        try {
            const data = await service.getGarments(req.query);
            return res.status(200).json({ success: true, message: 'Finished garments inventory retrieved', data: data.garments, pagination: data.pagination });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve finished garments' });
        }
    };

    createGarment = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const garment = await service.createGarment(req.body, user);
            return res.status(201).json({ success: true, message: 'Finished garment item created', data: garment });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to create finished garment' });
        }
    };

    updateGarment = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const garment = await service.updateGarment(req.params.id, req.body, user);
            return res.status(200).json({ success: true, message: 'Finished garment updated successfully', data: garment });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to update finished garment' });
        }
    };

    deleteGarment = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
            const garment = await service.deleteGarment(req.params.id, user);
            return res.status(200).json({ success: true, message: 'Finished garment deleted successfully', data: garment });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message || 'Failed to delete finished garment' });
        }
    };

    // Summary & Analytics & Transactions
    getSummary = async (req: Request, res: Response): Promise<Response> => {
        try {
            const summary = await service.getInventorySummary();
            return res.status(200).json({ success: true, message: 'Inventory summary retrieved', data: summary });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve inventory summary' });
        }
    };

    getAnalytics = async (req: Request, res: Response): Promise<Response> => {
        try {
            const analytics = await service.getInventoryAnalytics();
            return res.status(200).json({ success: true, message: 'Inventory analytics retrieved', data: analytics });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve inventory analytics' });
        }
    };

    getTransactions = async (req: Request, res: Response): Promise<Response> => {
        try {
            const data = await service.getTransactions(req.query);
            return res.status(200).json({ success: true, message: 'Inventory transactions log retrieved', data: data.transactions, pagination: data.pagination });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve inventory transactions' });
        }
    };
}
