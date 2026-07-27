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

export const downloadReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { filename, csvContent } = await reportsService.downloadReport(id);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csvContent);
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to download report' });
    }
};
