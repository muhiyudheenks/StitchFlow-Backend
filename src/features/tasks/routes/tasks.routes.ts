import { Router } from 'express';
import { getAllTasks, createTask, updateTask } from '../controllers/tasks.controller';

const router = Router();

router.get('/', getAllTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id', updateTask);

export default router;
