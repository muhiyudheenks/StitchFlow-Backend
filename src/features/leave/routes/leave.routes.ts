import { Router } from 'express';
import { getLeaveRequests, applyLeave, updateLeaveStatus } from '../controllers/leave.controller';

const router = Router();

router.get('/', getLeaveRequests);
router.post('/', applyLeave);
router.patch('/:id/status', updateLeaveStatus);

export default router;
