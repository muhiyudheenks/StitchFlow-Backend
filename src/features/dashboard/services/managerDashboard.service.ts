import mongoose from 'mongoose';
import User from '../../auth/models/userModel';
import Task from '../../tasks/models/taskModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import LeaveRequest from '../../leave/models/leaveRequestModel';
import AttendanceRecord from '../../attendance/models/managerAttendance.model';
import { InventoryService } from '../../inventory/services/adminInventory.service';

const inventoryService = new InventoryService();

export class ManagerDashboardService {
    async getDashboardOverview(managerId?: string) {
        let batchFilter: any = {};
        if (managerId) {
            const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
                ? new mongoose.Types.ObjectId(managerId)
                : managerId;
            batchFilter = {
                $or: [
                    { manager: managerObjectId },
                    { manager: managerId.toString() },
                ],
            };
        }
        const [
            activeEmployeesCount,
            totalEmployeesCount,
            batches,
            tasks,
            pendingTasksCount,
            pendingLeavesCount,
            inventoryAlertsCount,
        ] = await Promise.all([
            User.countDocuments({ role: 'employee', status: 'active' }),
            User.countDocuments({ role: 'employee' }),
            ProductionBatch.find(batchFilter).populate('manager', 'fullName email designation department').sort({ createdAt: -1 }),
            Task.find().sort({ createdAt: -1 }),
            Task.countDocuments({ status: 'Pending' }),
            LeaveRequest.countDocuments({ status: 'pending' }),
            inventoryService.getItems({ page: 1, limit: 100 }).then((res: any) => (res.items || []).filter((i: any) => i.quantity <= i.reorderLevel).length),
        ]);

        const completedTasksCount = tasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
        const totalTasksCount = tasks.length || 1;
        const efficiencyRate = Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100)) || 85;

        const completedPieces = tasks
            .filter((t) => (t.status || '').toLowerCase() === 'completed')
            .reduce((sum, t) => sum + ((t as any).completedQuantity || (t as any).quantity || 100), 0);
        const targetPieces = tasks.reduce((sum, t) => sum + ((t as any).targetQuantity || (t as any).quantity || 100), 0) || 5000;

        const productionBatches = batches.map((b) => {
            const batchTasks = tasks.filter((t) => (t as any).batchId?.toString() === b._id.toString() || (t as any).batchName === b.batchName);
            const doneTasks = batchTasks.filter((t) => {
                const s = (t.status || '').toLowerCase();
                return s === 'completed' || s === 'verified';
            }).length;
            const totTasks = batchTasks.length;

            const completedPcs = batchTasks.reduce((sum, t) => sum + ((t as any).completedQuantity || 0), 0);
            const taskTargetPcs = batchTasks.reduce((sum, t) => sum + ((t as any).targetQuantity || 0), 0);
            const targetPcs = taskTargetPcs > 0 ? taskTargetPcs : (b.quantity || 100);
            const pct = targetPcs > 0 ? Math.round((completedPcs / targetPcs) * 100) : 0;
            const eff = Math.min(100, pct) || (totTasks > 0 ? Math.min(100, Math.round((doneTasks / totTasks) * 100)) : 75);

            const managerObj = b.manager && typeof b.manager === 'object' ? b.manager : null;
            const managerName = (managerObj as any)?.fullName || 'Production Leader';

            return {
                id: b._id.toString(),
                name: b.batchName,
                completedTasks: doneTasks,
                totalTasks: totTasks,
                completedPcs,
                targetPcs,
                completedQuantity: completedPcs,
                targetQuantity: targetPcs,
                efficiency: eff,
                status: b.status,
                leader: managerName,
                managerName,
            };
        });

        const recentActivity: any[] = [];
        tasks.slice(0, 3).forEach((t) => {
            const taskTitle = t.taskName || (t as any).title || (t as any).operationName || 'Production Task';
            recentActivity.push({
                id: `t_${t._id}`,
                title: `Task: ${taskTitle}`,
                description: `Assigned task status is "${t.status}". Priority: ${t.priority || 'Medium'}.`,
                time: new Date((t as any).createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'task',
            });
        });

        batches.slice(0, 2).forEach((b) => {
            recentActivity.push({
                id: `b_${b._id}`,
                title: `Batch: ${b.batchName}`,
                description: `Production batch status is "${b.status}".`,
                time: new Date((b as any).createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'production',
            });
        });

        return {
            metrics: {
                todayProduction: completedPieces,
                targetProduction: targetPieces,
                efficiencyRate,
                activeEmployees: activeEmployeesCount,
                totalEmployees: totalEmployeesCount,
                pendingApprovals: pendingTasksCount + pendingLeavesCount,
                inventoryAlerts: inventoryAlertsCount,
            },
            productionBatches,
            productionLines: productionBatches,
            recentActivity,
        };
    }

    async getAssignedBatches(managerId?: string) {
        let filter: any = {};
        if (managerId) {
            const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
                ? new mongoose.Types.ObjectId(managerId)
                : managerId;
            filter = {
                $or: [
                    { manager: managerObjectId },
                    { manager: managerId.toString() },
                ],
            };
        }
        return await ProductionBatch.find(filter).sort({ createdAt: -1 });
    }

    async getTeamPerformance(managerId?: string) {
        const query: any = { role: 'employee' };
        if (managerId) {
            query.managerId = managerId;
        }
        const employees = await User.find(query);
        const tasks = await Task.find();

        return employees.map((emp) => {
            const empTasks = tasks.filter((t: any) => t.assignedEmployee?.toString() === emp._id.toString() || t.assignedTo?.toString() === emp._id.toString());
            const completed = empTasks.filter((t: any) => (t.status || '').toLowerCase() === 'completed').length;
            const rate = empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 100;
            return {
                employeeId: emp._id,
                fullName: emp.fullName,
                email: emp.email,
                designation: emp.designation,
                totalTasks: empTasks.length,
                completedTasks: completed,
                completionRate: rate,
            };
        });
    }

    async getPendingTasks(managerId?: string) {
        return await Task.find({ status: { $in: ['Pending', 'pending', 'in_progress', 'In Progress'] } }).sort({ createdAt: -1 });
    }

    async getTodayAttendance(managerId?: string) {
        const todayStr = new Date().toISOString().split('T')[0];
        return await AttendanceRecord.find({ date: todayStr }).populate('employeeId', 'fullName email department designation');
    }
}
