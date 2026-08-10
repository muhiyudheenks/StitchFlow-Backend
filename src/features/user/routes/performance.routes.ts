import { Router } from 'express';
import {
    getPerformanceData,
    getEmployeePerformanceById,
    getTeamPerformance,
} from '../controllers/employee.controller';

const performanceRouter = Router();

// GET /api/performance/me -> Authenticated Employee
performanceRouter.get('/me', getPerformanceData);

// GET /api/performance/team -> Manager / Admin
performanceRouter.get('/team', getTeamPerformance);

// GET /api/performance/:employeeId -> Manager / Admin
performanceRouter.get('/:employeeId', getEmployeePerformanceById);

// GET /api/performance -> Default fallback
performanceRouter.get('/', getPerformanceData);

export default performanceRouter;
