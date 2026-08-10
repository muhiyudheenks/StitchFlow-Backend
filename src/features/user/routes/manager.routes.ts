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
    getInventoryOverview,
    getReports,
    getManagerBatches,
    getManagerBatchById,
    getManagerBatchTasks,
    assignBatchTask,
    updateBatchTaskStatus,
    verifyBatchTask,
} from '../controllers/manager.controller';

const router = Router();

// Dashboard & Overview
router.get('/overview', getDashboardOverview);

// Manager Assigned Batches
router.get('/batches', getManagerBatches);
router.get('/batches/:batchId', getManagerBatchById);
router.get('/batches/:batchId/tasks', getManagerBatchTasks);
router.post('/batches/:batchId/tasks', assignBatchTask);
router.patch('/batches/:batchId/tasks/:taskId', updateBatchTaskStatus);
router.patch('/batches/:batchId/tasks/:taskId/verify', verifyBatchTask);

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

// Production Batch Monitoring (Read-Only for Assigned Batches)
router.get('/production', getProductionBatches);

// Inventory (Read-Only)
router.get('/inventory', getInventoryOverview);

// Reports
router.get('/reports', getReports);

export default router;

