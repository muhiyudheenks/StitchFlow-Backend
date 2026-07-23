import { Router } from 'express';
import { createUser, getManagedUsers } from '../controllers/userManagement.controller';

const router = Router();

router.post('/users/create', createUser);
router.get('/users', getManagedUsers);

export default router;
