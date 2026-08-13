import mongoose from 'mongoose';
import User from '../../auth/models/userModel';
import Task from '../../tasks/models/taskModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import LeaveRequest from '../../leave/models/leaveRequestModel';
import AttendanceRecord from '../../attendance/models/managerAttendance.model';
import { AppError } from '../../../shared/errors';

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

import { ManagerDashboardService } from '../../dashboard/services/managerDashboard.service';

const managerDashboardService = new ManagerDashboardService();

export class ManagerService {
    // 1. Dashboard Overview
    async getDashboardOverview(managerId?: string) {
        return await managerDashboardService.getDashboardOverview(managerId);
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
        const allTasks = await Task.find({ status: { $ne: 'Completed' } });

        return employees.map((u) => {
            const empTasks = allTasks.filter((t) => (t as any).assignedEmployee?.toString() === u._id.toString() || (t as any).assignedTo?.toString() === u._id.toString());

            return {
                id: u._id.toString(),
                name: u.fullName,
                email: u.email,
                department: u.department || 'Production',
                designation: u.designation || 'Operator',
                status: u.status || 'active',
                phone: u.phone || 'N/A',
                isVerified: u.isVerified,
                attendanceRate: 96,
                assignedTasks: empTasks.length,
            };
        });
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

    async getAttendanceRecords(managerId?: string) {
        if (!managerId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
            ? new mongoose.Types.ObjectId(managerId)
            : managerId;

        const teamEmployees = await User.find({
            role: 'employee',
            managerId: { $in: [managerObjectId, managerId] },
        }).select('_id');

        if (teamEmployees.length === 0) {
            return [];
        }

        const employeeIds = teamEmployees.map((u) => u._id);

        const records = await AttendanceRecord.find({
            employeeId: { $in: employeeIds },
            isApproved: { $in: [true, false] },
        })
            .populate('employeeId', 'fullName email department')
            .sort({ date: -1, createdAt: -1 });

        return records.map((r: any) => ({
            id: r._id.toString(),
            employeeName: (r.employeeId as any)?.fullName || 'Employee',
            department: (r.employeeId as any)?.department || 'Production',
            date: r.date,
            checkIn: r.checkIn || '—',
            checkOut: r.checkOut || '—',
            status: r.status,
            isApproved: r.isApproved ?? true,
        }));
    }

    async getLeaveRequests(managerId?: string) {
        if (!managerId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
            ? new mongoose.Types.ObjectId(managerId)
            : managerId;

        const teamEmployees = await User.find({
            role: 'employee',
            managerId: { $in: [managerObjectId, managerId] },
        }).select('_id');

        const employeeIds = teamEmployees.map((u) => u._id.toString());

        if (employeeIds.length === 0) {
            return [];
        }

        return await leaveService.getLeaveRequests(employeeIds);
    }

    async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', managerId: string) {
        return await leaveService.updateLeaveStatus(leaveId, status, managerId);
    }

    async getProductionBatches(managerId?: string) {
        return await productionService.getProductionBatches('manager', managerId);
    }

    async getInventoryOverview() {
        const items = await inventoryService.getInventoryItems();
        const alertsCount = items.filter((i: any) => i.quantity <= i.reorderLevel).length;
        return { items, alertsCount };
    }

    async getReports(type: string = 'summary') {
        return await reportsService.getReports('manager');
    }

    // 4. Assigned Batches Workflow for Manager Dashboard
    async getManagerAssignedBatches(managerId: string) {
        if (!managerId) {
            throw AppError.unauthorized('User not authenticated');
        }

        const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
            ? new mongoose.Types.ObjectId(managerId)
            : managerId;

        const batchFilter = {
            $or: [
                { manager: managerObjectId },
                { manager: managerId.toString() },
            ],
        };

        const batches = await ProductionBatch.find(batchFilter)
            .populate('manager', 'fullName email designation department')
            .populate('members', 'fullName email designation department employeeType status')
            .sort({ createdAt: -1 })
            .lean();

        console.log('[DEBUG BATCHES] Logged in manager id:', managerId);
        console.log('[DEBUG BATCHES] Batch manager ids:', batches.map((b: any) => (b.manager as any)?._id || b.manager));
        console.log('[DEBUG BATCHES] Mongo query:', JSON.stringify(batchFilter));
        console.log('[DEBUG BATCHES] Returned batches count:', batches.length);

        const batchIds = batches.map((b) => b._id);
        const tasks = await Task.find({ batchId: { $in: batchIds } })
            .populate('assignedEmployee', 'fullName email designation department employeeType')
            .lean();

        const tasksByBatch = new Map<string, any[]>();
        tasks.forEach((t: any) => {
            const bId = t.batchId?.toString();
            if (bId) {
                if (!tasksByBatch.has(bId)) {
                    tasksByBatch.set(bId, []);
                }
                tasksByBatch.get(bId)!.push(t);
            }
        });

        return batches.map((b: any) => {
            const batchIdStr = b._id.toString();
            const bTasks = tasksByBatch.get(batchIdStr) || [];
            const totalTasks = bTasks.length;
            const completedTasks = bTasks.filter((t) => {
                const s = (t.status || '').toLowerCase();
                return s === 'completed' || s === 'verified';
            }).length;
            const pendingTasks = bTasks.filter((t) => {
                const s = (t.status || '').toLowerCase();
                return s === 'pending' || s === 'in_progress' || s === 'under_review' || s === 'under review';
            }).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const membersList = Array.isArray(b.members)
                ? b.members.map((m: any) => ({
                    id: m._id?.toString() || m.toString(),
                    _id: m._id?.toString() || m.toString(),
                    fullName: m.fullName || 'Employee',
                    email: m.email || '',
                    department: m.department || 'Production',
                    designation: m.designation || 'Worker',
                    employeeType: m.employeeType || 'stitching_worker',
                    status: m.status || 'active',
                }))
                : [];

            const managerObj = b.manager && typeof b.manager === 'object'
                ? {
                    id: b.manager._id?.toString(),
                    _id: b.manager._id?.toString(),
                    fullName: b.manager.fullName || 'Manager',
                    email: b.manager.email || '',
                    designation: b.manager.designation || 'Production Manager',
                    department: b.manager.department || 'Production',
                }
                : {
                    id: managerId,
                    _id: managerId,
                    fullName: 'Self',
                };

            const garmentName = b.productName || b.garmentName || 'Garment';
            const dueDate = b.expectedEndDate || b.dueDate || b.startDate || null;

            return {
                id: batchIdStr,
                _id: batchIdStr,
                batchName: b.batchName,
                batchNumber: b.batchNumber || b.batchCode || `BATCH-${batchIdStr.slice(-4)}`,
                status: b.status || 'Active',
                progress,
                progressPercentage: progress,
                totalMembers: membersList.length,
                completedTasks,
                pendingTasks,
                totalTasks,
                dueDate,
                garmentName,
                productName: garmentName,
                manager: managerObj,
                members: membersList,
                tasks: bTasks.map((t: any) => ({
                    id: t._id.toString(),
                    _id: t._id.toString(),
                    taskName: t.taskName || t.title || 'Task',
                    status: t.status || 'Pending',
                    assignedEmployeeName: t.assignedEmployee?.fullName || 'Unassigned',
                    assignedEmployeeId: t.assignedEmployee?._id?.toString() || '',
                    targetQuantity: t.targetQuantity || 100,
                    completedQuantity: t.completedQuantity || 0,
                    workerType: t.workerType || 'Stitching',
                    priority: t.priority || 'Medium',
                    dueDate: t.dueDate || null,
                })),
            };
        });
    }

    async getManagerBatchById(batchId: string, managerId: string) {
        const batch = await ProductionBatch.findById(batchId)
            .populate('manager', 'fullName email designation department')
            .populate('members', 'fullName email designation department employeeType status')
            .lean();

        if (!batch) {
            throw AppError.notFound('Production batch not found');
        }

        const batchManagerId = (batch.manager as any)?._id?.toString() || (batch.manager as any)?.toString();
        if (batchManagerId !== managerId) {
            throw AppError.forbidden('Access denied: You are not authorized to access this batch');
        }

        const tasks = await Task.find({ batchId })
            .populate('assignedEmployee', 'fullName email designation department employeeType')
            .sort({ createdAt: -1 })
            .lean();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => {
            const s = (t.status || '').toLowerCase();
            return s === 'completed' || s === 'verified';
        }).length;
        const pendingTasks = tasks.filter((t: any) => {
            const s = (t.status || '').toLowerCase();
            return s === 'pending' || s === 'in_progress' || s === 'under_review' || s === 'under review';
        }).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const membersList = Array.isArray(batch.members)
            ? batch.members.map((m: any) => ({
                id: m._id?.toString() || m.toString(),
                _id: m._id?.toString() || m.toString(),
                fullName: m.fullName || 'Employee',
                email: m.email || '',
                department: m.department || 'Production',
                designation: m.designation || 'Worker',
                employeeType: m.employeeType || 'stitching_worker',
                status: m.status || 'active',
            }))
            : [];

        const garmentName = batch.productName || (batch as any).garmentName || 'Garment';
        const dueDate = batch.expectedEndDate || (batch as any).dueDate || batch.startDate || null;

        return {
            id: batch._id.toString(),
            _id: batch._id.toString(),
            batchName: batch.batchName,
            batchNumber: batch.batchNumber || batch.batchCode || `BATCH-${batch._id.toString().slice(-4)}`,
            status: batch.status || 'Active',
            progress,
            progressPercentage: progress,
            totalMembers: membersList.length,
            completedTasks,
            pendingTasks,
            totalTasks,
            dueDate,
            garmentName,
            productName: garmentName,
            manager: batch.manager,
            members: membersList,
            tasks: tasks.map((t: any) => ({
                id: t._id.toString(),
                _id: t._id.toString(),
                taskName: t.taskName || t.title || 'Task',
                status: t.status || 'Pending',
                assignedEmployeeName: t.assignedEmployee?.fullName || 'Unassigned',
                assignedEmployeeId: t.assignedEmployee?._id?.toString() || '',
                targetQuantity: t.targetQuantity || 100,
                completedQuantity: t.completedQuantity || 0,
                workerType: t.workerType || 'Stitching',
                priority: t.priority || 'Medium',
                dueDate: t.dueDate || null,
                description: t.description || '',
            })),
        };
    }

    async getManagerBatchTasks(batchId: string, managerId: string) {
        // Enforce batch ownership
        await this.getManagerBatchById(batchId, managerId);
        return await taskService.getTasksByBatch(batchId);
    }

    async assignBatchTask(batchId: string, managerId: string, taskData: any) {
        // Enforce batch ownership
        await this.getManagerBatchById(batchId, managerId);
        return await taskService.dispatchBatchTask({ ...taskData, batchId }, managerId);
    }

    async updateBatchTaskStatus(batchId: string, taskId: string, managerId: string, updateData: any) {
        // Enforce batch ownership
        await this.getManagerBatchById(batchId, managerId);
        return await taskService.updateTask(taskId, updateData);
    }

    async verifyBatchTask(batchId: string, taskId: string, managerId: string, status: 'Completed' | 'Rejected') {
        // Enforce batch ownership
        await this.getManagerBatchById(batchId, managerId);
        return await taskService.verifyTask(taskId, status, managerId);
    }
}
