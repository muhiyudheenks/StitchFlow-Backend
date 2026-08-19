import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import * as salaryService from '../services/salary.service';
import { asyncHandler } from '../../../shared/errors';

export const getSalaryOverview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || '';
    const data = await salaryService.getSalaryOverview(userId);
    return res.status(200).json({ success: true, message: 'Salary overview calculated successfully', data });
});

export const downloadPayslip = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { filename, content } = await salaryService.generatePayslipPdf(id);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
});
