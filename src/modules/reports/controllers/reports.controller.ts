import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { asyncHandler } from '../../../shared/errors';
import { reportsService } from '../services/reports.service';


export const getReports = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await reportsService.getReports(req.user?.role);
    return res.status(200).json({ success: true, message: 'Reports catalog retrieved', data });
});

export const downloadReport = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { filename, csvContent } = await reportsService.downloadReport(id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
});
