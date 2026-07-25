import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProductionLineService } from '../services/productionLineService';

export class ProductionLineController {
    private service = new ProductionLineService();

    createLine = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const line = await this.service.createLine(req.body);
            return res.status(201).json({
                success: true,
                message: 'Production line created successfully.',
                productionLine: line,
                data: line,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to create production line.',
            });
        }
    };

    getAllLines = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const lines = await this.service.getAllLines(req.query);
            return res.status(200).json({
                success: true,
                message: 'Production lines retrieved successfully.',
                productionLines: lines,
                data: lines,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve production lines.',
            });
        }
    };

    getLineById = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const line = await this.service.getLineById(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Production line details retrieved successfully.',
                productionLine: line,
                data: line,
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                message: error.message || 'Production line not found.',
            });
        }
    };

    updateLine = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const line = await this.service.updateLine(req.params.id, req.body);
            return res.status(200).json({
                success: true,
                message: 'Production line updated successfully.',
                productionLine: line,
                data: line,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to update production line.',
            });
        }
    };

    deleteLine = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            await this.service.deleteLine(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Production line deleted successfully.',
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                message: error.message || 'Failed to delete production line.',
            });
        }
    };

    assignEmployees = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            const { lineId } = req.params;
            const result = await this.service.assignEmployees(lineId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Employees assigned to production line successfully.',
                data: result,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Failed to assign employees to line.',
            });
        }
    };
}
