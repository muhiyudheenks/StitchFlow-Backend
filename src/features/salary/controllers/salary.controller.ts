import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { SalaryService } from '../services/salary.service';

const salaryService = new SalaryService();

export const getSalaryOverview = async (req: AuthRequest, res: Response) => {
    try {
        const data = await salaryService.getSalaryOverview(req.user?.id);
        return res.status(200).json({ success: true, message: 'Salary overview retrieved', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
