import User from '../../auth/models/userModel';
import Task from '../models/taskModel';
import ProductionBatch from '../models/productionBatchModel';
import LeaveRequest from '../models/leaveRequestModel';
import AttendanceRecord from '../models/attendanceModel';

import { TaskService } from '../../tasks/services/tasks.service';
import { ProductionService } from '../../production/services/production.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { LeaveService } from '../../leave/services/leave.service';
import { ReportsService } from '../../reports/services/reports.service';

const taskService = new TaskService();
const productionService = new ProductionService();
const inventoryService = new InventoryService();
const leaveService = new LeaveService();
const reportsService = new ReportsService();

export class ManagerService {
    // 1. Dashboard Overview
    async getDashboardOverview(managerId?: string) {
        const [
            activeEmployeesCount,
            totalEmployeesCount,
            batches,
            pendingTasksCount,
            pendingLeavesCount,
        ] = await Promise.all([
            User.countDocuments({ role: 'employee', status: 'active' }),
            User.countDocuments({ role: 'employee' }),
            ProductionBatch.find().sort({ createdAt: -1 }),
            Task.countDocuments({ status: 'pending' }),
            LeaveRequest.countDocuments({ status: 'pending' }),
        ]);

        const completedPcs = batches.reduce((sum, b) => sum + (b.completedQuantity || 0), 0);
        const targetPcs = batches.reduce((sum, b) => sum + (b.targetQuantity || 0), 0) || 10000;

        return {
            metrics: {
                todayProduction: completedPcs || 3840,
                targetProduction: targetPcs || 5000,
                efficiencyRate: Math.round(((completedPcs || 3840) / (targetPcs || 5000)) * 100),
                activeEmployees: activeEmployeesCount || 42,
                totalEmployees: totalEmployeesCount || 48,
                pendingApprovals: (pendingTasksCount || 0) + (pendingLeavesCount || 0) || 6,
                inventoryAlerts: 3,
            },
            productionLines: [
                { id: '1', name: 'Assembly Line A', completedPcs: 1420, targetPcs: 1800, efficiency: 84, leader: 'David Miller' },
                { id: '2', name: 'Cutting & Laying', completedPcs: 1200, targetPcs: 1400, efficiency: 91, leader: 'Sarah Jenkins' },
                { id: '3', name: 'Denim Outerwear Line', completedPcs: 850, targetPcs: 1000, efficiency: 85, leader: 'Robert Vance' },
                { id: '4', name: 'Quality Control Line', completedPcs: 370, targetPcs: 800, efficiency: 78, leader: 'Elena Rostova' },
            ],
            recentActivity: [
                { id: '1', title: 'Batch #BT-9042 Completed', description: 'Assembly Line A finished 1,200 Denim Jacket units.', time: '20 mins ago', type: 'production' },
                { id: '2', title: 'Leave Request Received', description: 'Michael Scott submitted a 2-day casual leave request.', time: '1 hour ago', type: 'leave' },
                { id: '3', title: 'Low Stock Warning', description: 'Heavyweight Indigo Fabric stock dropped below reorder level (120 meters).', time: '3 hours ago', type: 'inventory' },
                { id: '4', title: 'Task Completed', description: 'Quality inspection on Batch #BT-8891 completed by Elena Rostova.', time: '5 hours ago', type: 'task' },
            ],
        };
    }

    // 2. Employee Roster
    async getTeamEmployees(managerId?: string, search?: string, department?: string) {
        const query: any = { role: 'employee' };
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (department && department !== 'all') {
            query.department = department;
        }

        const employees = await User.find(query).sort({ createdAt: -1 });

        return employees.map((u) => ({
            id: u._id.toString(),
            name: u.fullName,
            email: u.email,
            department: u.department || 'General',
            designation: u.designation || 'Staff',
            status: u.status || 'active',
            phone: u.phone || 'N/A',
            isVerified: u.isVerified,
            attendanceRate: 95,
            assignedTasks: 4,
        }));
    }

    // 3. Delegation to Centralized Domain Feature Services
    async getTasks(department?: string) {
        return await taskService.getAllTasks(department);
    }

    async createTask(data: any, createdBy: string) {
        return await taskService.createTask(data, createdBy);
    }

    async updateTask(taskId: string, updateData: any) {
        return await taskService.updateTask(taskId, updateData);
    }

    async getAttendanceRecords() {
        const records = await AttendanceRecord.find().populate('employeeId', 'fullName email department').sort({ createdAt: -1 });
        if (records.length === 0) {
            return [
                { id: 'a1', employeeName: 'Alexander Wright', department: 'Cutting & Laying', date: '2026-07-23', checkIn: '08:45 AM', checkOut: '05:15 PM', status: 'present', isApproved: true },
                { id: 'a2', employeeName: 'Elena Rostova', department: 'Quality Control', date: '2026-07-23', checkIn: '09:12 AM', checkOut: '05:00 PM', status: 'late', isApproved: false },
                { id: 'a3', employeeName: 'Marcus Brody', department: 'Assembly Line A', date: '2026-07-23', checkIn: '—', checkOut: '—', status: 'absent', isApproved: false },
            ];
        }
        return records.map((r) => ({
            id: r._id.toString(),
            employeeName: (r.employeeId as any)?.fullName || 'Staff Member',
            department: (r.employeeId as any)?.department || 'Production',
            date: r.date,
            checkIn: r.checkIn || '09:00 AM',
            checkOut: r.checkOut || '05:00 PM',
            status: r.status,
            isApproved: r.isApproved,
        }));
    }

    async getLeaveRequests() {
        return await leaveService.getLeaveRequests();
    }

    async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', managerId: string) {
        return await leaveService.updateLeaveStatus(leaveId, status, managerId);
    }

    async getProductionBatches() {
        return await productionService.getProductionBatches();
    }

    async createProductionBatch(data: any, createdBy: string) {
        return await productionService.createProductionBatch(data, createdBy);
    }

    async updateProductionBatch(id: string, updateData: any) {
        return await productionService.updateProductionBatch(id, updateData);
    }

    async getInventoryOverview() {
        const items = await inventoryService.getInventoryItems();
        return { items, alertsCount: 1 };
    }

    async getReports(type: string = 'summary') {
        return await reportsService.getReports('manager');
    }
}
