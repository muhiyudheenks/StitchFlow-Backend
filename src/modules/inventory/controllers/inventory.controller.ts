import { Request, Response, NextFunction } from 'express';
import * as service from '../services/inventory.service';
import { asyncHandler } from '../../../shared/errors';

export const getFabrics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await service.getFabrics(req.query);
    return res.status(200).json({ success: true, message: 'Fabric inventory retrieved', data: data.fabrics, pagination: data.pagination });
});

export const createFabric = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const fabric = await service.createFabric(req.body, user);
    return res.status(201).json({ success: true, message: 'Fabric item created successfully', data: fabric });
});

export const updateFabric = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const fabric = await service.updateFabric(req.params.id, req.body, user);
    return res.status(200).json({ success: true, message: 'Fabric item updated successfully', data: fabric });
});

export const deleteFabric = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const fabric = await service.deleteFabric(req.params.id, user);
    return res.status(200).json({ success: true, message: 'Fabric item deleted successfully', data: fabric });
});

export const getThreads = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await service.getThreads(req.query);
    return res.status(200).json({ success: true, message: 'Thread inventory retrieved', data: data.threads, pagination: data.pagination });
});

export const createThread = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const thread = await service.createThread(req.body, user);
    return res.status(201).json({ success: true, message: 'Thread item created successfully', data: thread });
});

export const updateThread = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const thread = await service.updateThread(req.params.id, req.body, user);
    return res.status(200).json({ success: true, message: 'Thread item updated successfully', data: thread });
});

export const deleteThread = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const thread = await service.deleteThread(req.params.id, user);
    return res.status(200).json({ success: true, message: 'Thread item deleted successfully', data: thread });
});

export const getGarments = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await service.getGarments(req.query);
    return res.status(200).json({ success: true, message: 'Finished garments inventory retrieved', data: data.garments, pagination: data.pagination });
});

export const createGarment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const garment = await service.createGarment(req.body, user);
    return res.status(201).json({ success: true, message: 'Finished garment item created', data: garment });
});

export const updateGarment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const garment = await service.updateGarment(req.params.id, req.body, user);
    return res.status(200).json({ success: true, message: 'Finished garment updated successfully', data: garment });
});

export const deleteGarment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = (req as any).user?.fullName || (req as any).user?.email || 'Admin User';
    const garment = await service.deleteGarment(req.params.id, user);
    return res.status(200).json({ success: true, message: 'Finished garment deleted successfully', data: garment });
});

export const getSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const summary = await service.getInventorySummary();
    return res.status(200).json({ success: true, message: 'Inventory summary retrieved', data: summary });
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const analytics = await service.getInventoryAnalytics();
    return res.status(200).json({ success: true, message: 'Inventory analytics retrieved', data: analytics });
});

export const getTransactions = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await service.getTransactions(req.query);
    return res.status(200).json({ success: true, message: 'Inventory transactions log retrieved', data: data.transactions, pagination: data.pagination });
});
