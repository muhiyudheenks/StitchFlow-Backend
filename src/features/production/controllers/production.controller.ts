import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionService } from '../services/production.service';

const productionService = new ProductionService();

export const getProductionBatches = async (req: AuthRequest, res: Response) => {
    try {
        const data = await productionService.getProductionBatches();
        return res.status(200).json({ success: true, message: 'Production batches retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await productionService.createProductionBatch(req.body, req.user?.id || '');
        return res.status(201).json({ success: true, message: 'Production batch created', data: batch });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateProductionBatch = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await productionService.updateProductionBatch(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Batch updated', data: batch });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
