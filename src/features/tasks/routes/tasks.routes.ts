import { Router } from 'express';
import {
    getAllTasks,
    getTasksByBatch,
    createTask,
    updateTask,
    updateTaskProgress,
    completeTask,
    verifyTask,
} from '../controllers/tasks.controller';

const router = Router();

router.get('/', getAllTasks);
router.get('/batch/:batchId', getTasksByBatch);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id', updateTask);
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id/complete', completeTask);
router.patch('/:id/verify', verifyTask);

export default router;
