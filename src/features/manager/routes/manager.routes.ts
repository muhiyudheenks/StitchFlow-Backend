import { Router } from 'express';
import {
    getDashboardOverview,
    getTeamEmployees,
    getTasks,
    createTask,
    updateTask,
    getAttendanceRecords,
    getLeaveRequests,
    updateLeaveStatus,
    getProductionBatches,
    createProductionBatch,
    updateProductionBatch,
    getInventoryOverview,
    getReports,
} from '../controllers/manager.controller';

const router = Router();

// Dashboard & Overview
router.get('/overview', getDashboardOverview);

// Employee Management
router.get('/employees', getTeamEmployees);

// Task Management
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.patch('/tasks/:id', updateTask);

// Attendance & Leave Management
router.get('/attendance', getAttendanceRecords);
router.get('/leaves', getLeaveRequests);
router.patch('/leaves/:id', updateLeaveStatus);

// Production Batch Management
router.get('/production', getProductionBatches);
router.post('/production', createProductionBatch);
router.put('/production/:id', updateProductionBatch);

// Inventory (Read-Only)
router.get('/inventory', getInventoryOverview);

// Reports
router.get('/reports', getReports);

export default router;
