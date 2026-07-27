import { Router } from 'express';
import { getSalaryOverview, downloadPayslip } from '../controllers/salary.controller';

const router = Router();

router.get('/me', getSalaryOverview);
router.get('/payslip/:id', downloadPayslip);
router.get('/', getSalaryOverview);

export default router;
