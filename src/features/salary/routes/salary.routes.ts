import { Router } from 'express';
import { getSalaryOverview } from '../controllers/salary.controller';

const router = Router();

router.get('/', getSalaryOverview);

export default router;
