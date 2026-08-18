import { Router } from 'express';
import { getReports, downloadReport } from '../controllers/reports.controller';

const router = Router();

router.get('/', getReports);
router.get('/download/:id', downloadReport);

export default router;
