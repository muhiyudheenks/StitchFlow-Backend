import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ReportsService } from '../services/reports.service';

const reportsService = new ReportsService();

export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        const data = await reportsService.getReports(req.user?.role);
        return res.status(200).json({ success: true, message: 'Reports catalog retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
