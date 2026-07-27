import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionService } from '../services/production.service';

const service = new ProductionService();

export const getProductionBatches = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;
        const userId = req.user?.id;
        const data = await service.getProductionBatches(role, userId);
        return res.status(200).json({ success: true, message: 'Production batches retrieved', data });
    } catch (err: any) {
        console.error('[ProductionController.getProductionBatches Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Failed to retrieve batches' });
    }
};

export const getProductionBatchById = async (req: AuthRequest, res: Response) => {
    try {
        const data = await service.getProductionBatchById(req.params.id);
        return res.status(200).json({ success: true, message: 'Production batch retrieved', data });
    } catch (err: any) {
        console.error('[ProductionController.getProductionBatchById Error]:', err.message);
        return res.status(404).json({ success: false, message: err.message || 'Batch not found' });
    }
};

export const createProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const creator = req.user?.id || 'Admin';
        const batch = await service.createProductionBatch(req.body, creator);
        return res.status(201).json({
            success: true,
            message: 'Production batch created successfully',
            data: batch,
        });
    } catch (err: any) {
        console.error('[ProductionController.createProductionBatch Validation Error]:', err.message);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to create production batch',
        });
    }
};

export const updateProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await service.updateProductionBatch(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Production batch updated successfully', data: batch });
    } catch (err: any) {
        console.error('[ProductionController.updateProductionBatch Error]:', err.message);
        return res.status(400).json({ success: false, message: err.message || 'Failed to update batch' });
    }
};
