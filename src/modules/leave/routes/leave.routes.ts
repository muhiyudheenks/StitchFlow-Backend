import { Router } from 'express';
import { getMyLeaves, getLeaveRequests, applyLeave, updateLeaveStatus } from '../controllers/leave.controller';

const router = Router();

router.get('/my', getMyLeaves);
router.get('/', getLeaveRequests);
router.post('/', applyLeave);
router.patch('/:id/status', updateLeaveStatus);

export default router;
