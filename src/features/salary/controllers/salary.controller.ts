import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { SalaryService } from '../services/salary.service';

const salaryService = new SalaryService();

export const getSalaryOverview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id || '';
        const data = await salaryService.getSalaryOverview(userId);
        return res.status(200).json({ success: true, message: 'Salary overview calculated successfully', data });
    } catch (err: any) {
        console.error('[SalaryController.getSalaryOverview Error]:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const downloadPayslip = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { filename, content } = await salaryService.generatePayslipPdf(id);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(content);
    } catch (err: any) {
        console.error('[SalaryController.downloadPayslip Error]:', err.message);
        return res.status(404).json({ success: false, message: err.message || 'Payslip not found' });
    }
};
