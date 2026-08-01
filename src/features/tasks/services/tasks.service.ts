import Task from '../../manager/models/taskModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import User from '../../auth/models/userModel';
import { NotificationsService } from '../../notifications/services/notifications.service';

const notifService = new NotificationsService();

export class TaskService {
    async getAllTasks(filterQuery?: any) {
        let query: any = {};
        if (filterQuery?.assignedEmployee) {
            query.assignedEmployee = filterQuery.assignedEmployee;
        }
        if (filterQuery?.batchId) {
            query.batchId = filterQuery.batchId;
        }
        if (filterQuery?.status) {
            query.status = filterQuery.status;
        }

        const tasks = await Task.find(query)
            .populate('assignedEmployee', 'fullName email department designation employeeType')
            .populate('batchId', 'batchName status')
            .populate('verifiedByManager', 'fullName email')
            .sort({ createdAt: -1 });

        return tasks.map((t: any) => ({
            id: t._id.toString(),
            _id: t._id.toString(),
            batchId: t.batchId?._id?.toString() || t.batchId?.toString() || '',
            batchName: t.batchId?.batchName || 'Batch',
            taskName: t.taskName || t.title || 'Task',
            operationType: t.operationType || 'Stitching',
            workerType: t.workerType || 'Stitching',
            assignedEmployee: t.assignedEmployee?._id?.toString() || t.assignedTo?.toString() || '',
            assignedEmployeeName: t.assignedEmployee?.fullName || t.assignee || 'Unassigned',
            priority: t.priority || 'Medium',
            targetQuantity: t.targetQuantity || 100,
            completedQuantity: t.completedQuantity || 0,
            status: t.status || 'Pending',
            description: t.description || '',
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A',
            verifiedByManager: t.verifiedByManager?.fullName || null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));
    }

    async getTasksByBatch(batchId: string) {
        return await this.getAllTasks({ batchId });
    }

    async createTask(data: any, createdBy: string) {
        const batchId = data.batchId;
        if (!batchId) {
            throw new Error('Batch ID is required for task creation');
        }

        const assignedEmployeeId = data.assignedEmployee || data.assignedTo || data.employeeId;

        // If no single employee specified, dispatch to ALL allocated batch members
        if (!assignedEmployeeId) {
            return await this.dispatchBatchTask(data, createdBy);
        }

        const batch = await ProductionBatch.findById(batchId);
        if (!batch) {
            throw new Error('Production batch not found');
        }

        if (batch.status === 'Completed' || batch.status === 'COMPLETED') {
            throw new Error('Cannot assign tasks to a completed batch');
        }

        const employee = await User.findById(assignedEmployeeId);
        if (!employee) {
            throw new Error('Assigned employee does not exist');
        }

        // Validate employee belongs to batch members
        const batchMembers = (batch.members || []).map((m: any) => m.toString());
        if (batchMembers.length > 0 && !batchMembers.includes(assignedEmployeeId.toString())) {
            throw new Error('Assigned employee does not belong to this production batch. Only batch members can be assigned tasks.');
        }

        const workerType = data.workerType || 'Stitching';
        const taskName = data.taskName || data.operation || data.title || 'Production Task';
        const targetQuantity = Number(data.targetQuantity || data.quantity || 100);

        // Check duplicate active task
        const duplicateTask = await Task.findOne({
            batchId,
            assignedEmployee: assignedEmployeeId,
            taskName,
            status: { $nin: ['Completed', 'Verified'] },
        });

        if (duplicateTask) {
            throw new Error(`An active task '${taskName}' is already assigned to this employee in this batch.`);
        }

        const task = new Task({
            batchId,
            assignedEmployee: assignedEmployeeId,
            taskName,
            workerType,
            operationType: workerType,
            priority: data.priority || 'Medium',
            targetQuantity,
            completedQuantity: Number(data.completedQuantity || 0),
            status: 'Pending',
            description: data.description || '',
            dueDate: data.dueDate || data.deadline ? new Date(data.dueDate || data.deadline) : undefined,
            createdBy: createdBy || 'Manager',
        });

        await task.save();

        await ProductionBatch.findByIdAndUpdate(
            batchId,
            {
                $addToSet: { members: assignedEmployeeId },
                status: batch.status === 'Active' ? 'In Progress' : batch.status,
            },
            { new: true }
        );

        // Trigger Notification
        try {
            const managerUser = typeof createdBy === 'string' && createdBy.length === 24
                ? await User.findById(createdBy).select('fullName')
                : null;
            const managerName = managerUser?.fullName || (typeof createdBy === 'string' ? createdBy : 'Manager');

            const dueDateStr = task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A';

            const formattedMessage = `New Task Assigned\n\nTask:\n${taskName}\n\nBatch:\n${batch.batchName}\n\nAssigned By:\n${managerName}\n\nPriority:\n${task.priority || 'Medium'}\n\nDue:\n${dueDateStr}`;

            await notifService.createNotification({
                recipient: assignedEmployeeId.toString(),
                sender: managerName,
                title: 'New Task Assigned',
                message: formattedMessage,
                type: 'TASK_ASSIGNED',
                batchId: batchId.toString(),
                taskId: task._id.toString(),
                batchName: batch.batchName,
                taskName,
                priority: task.priority as any,
            });
        } catch (err) {
            console.error('[TaskService] Notification trigger error:', err);
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedEmployee', 'fullName email department designation employeeType')
            .populate('batchId', 'batchName status');

        return {
            id: task._id.toString(),
            _id: task._id.toString(),
            batchId: (populatedTask as any)?.batchId?._id?.toString() || batchId,
            batchName: (populatedTask as any)?.batchId?.batchName || batch.batchName,
            taskName,
            operationType: task.operationType,
            workerType: task.workerType,
            assignedEmployee: assignedEmployeeId,
            assignedEmployeeName: (populatedTask as any)?.assignedEmployee?.fullName || employee.fullName,
            priority: task.priority,
            targetQuantity: task.targetQuantity,
            completedQuantity: task.completedQuantity,
            status: task.status,
            description: task.description,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'N/A',
        };
    }

    async dispatchBatchTask(data: any, createdBy: string) {
        const batchId = data.batchId;
        if (!batchId) {
            throw new Error('Production Batch is required for task dispatch');
        }

        const batch = await ProductionBatch.findById(batchId);
        if (!batch) {
            throw new Error('Production batch not found');
        }

        if (batch.status === 'Completed' || batch.status === 'COMPLETED') {
            throw new Error('Cannot dispatch tasks to a completed batch');
        }

        const productName = (data.productName || data.garmentProduct || (batch as any).garmentName || batch.productName || 'Garment Product').trim();

        let taskName = (data.taskName || data.title || '').trim();
        if (!taskName) {
            taskName = `${productName} Production`;
        }

        const targetQuantity = Number(data.targetQuantity || data.quantity || 100);

        // Gather all allocated employees and their category
        const cuttingWorkers = (batch.cuttingWorkers || []).map((id: any) => id.toString());
        const stitchingWorkers = (batch.stitchingWorkers || []).map((id: any) => id.toString());
        const finishingWorkers = (batch.finishingWorkers || []).map((id: any) => id.toString());
        const members = (batch.members || []).map((id: any) => id.toString());

        const workerCategoryMap = new Map<string, 'Cutting' | 'Stitching' | 'Finishing'>();

        cuttingWorkers.forEach((id) => workerCategoryMap.set(id, 'Cutting'));
        finishingWorkers.forEach((id) => workerCategoryMap.set(id, 'Finishing'));
        stitchingWorkers.forEach((id) => workerCategoryMap.set(id, 'Stitching'));

        // Any members not explicitly categorized, default to Stitching
        members.forEach((id) => {
            if (!workerCategoryMap.has(id)) {
                workerCategoryMap.set(id, 'Stitching');
            }
        });

        if (workerCategoryMap.size === 0) {
            throw new Error(`No employees allocated to batch '${batch.batchName}'. Please ensure employees are assigned to this batch before dispatching tasks.`);
        }

        const managerUser = typeof createdBy === 'string' && createdBy.length === 24
            ? await User.findById(createdBy).select('fullName')
            : null;
        const managerName = managerUser?.fullName || (typeof createdBy === 'string' ? createdBy : 'Manager');

        const createdTasks: any[] = [];

        for (const [empId, workerType] of workerCategoryMap.entries()) {
            const employee = await User.findById(empId);
            if (!employee) continue;

            const existingTask = await Task.findOne({
                batchId,
                assignedEmployee: empId,
                taskName: taskName.trim(),
                status: { $nin: ['Completed', 'Verified'] },
            });

            if (existingTask) continue;

            const task = new Task({
                batchId,
                assignedEmployee: empId,
                taskName: taskName.trim(),
                workerType,
                operationType: workerType,
                priority: data.priority || 'Medium',
                targetQuantity,
                completedQuantity: 0,
                status: 'Pending',
                description: data.description || '',
                dueDate: data.dueDate || data.deadline ? new Date(data.dueDate || data.deadline) : undefined,
                createdBy: createdBy || 'Manager',
            });

            await task.save();
            createdTasks.push(task);

            // Trigger Notification for each employee
            try {
                const dueDateStr = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A';

                const formattedMessage = `New Task Assigned\n\nTask:\n${taskName.trim()}\n\nBatch:\n${batch.batchName}\n\nAssigned By:\n${managerName}\n\nPriority:\nMedium\n\nDue:\n${dueDateStr}`;

                await notifService.createNotification({
                    recipient: empId,
                    sender: managerName,
                    title: 'New Task Assigned',
                    message: formattedMessage,
                    type: 'TASK_ASSIGNED',
                    batchId: batchId.toString(),
                    taskId: task._id.toString(),
                    batchName: batch.batchName,
                    taskName: taskName.trim(),
                    priority: 'Medium',
                });
            } catch (err) {
                console.error('[TaskService] Notification trigger error:', err);
            }
        }

        // Update batch status to 'In Progress' if 'Active'
        if (batch.status === 'Active') {
            batch.status = 'In Progress';
            await batch.save();
        }

        return createdTasks;
    }

    async updateTask(taskId: string, updateData: any) {
        const task = await Task.findByIdAndUpdate(taskId, updateData, { new: true })
            .populate('assignedEmployee', 'fullName email department designation')
            .populate('batchId', 'batchName status');

        if (!task) {
            throw new Error('Task not found');
        }

        return task;
    }

    async updateTaskProgress(taskId: string, completedQuantity: number, status?: string) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        task.completedQuantity = Number(completedQuantity);
        if (!task.startedAt) {
            task.startedAt = new Date();
        }

        if (status) {
            task.status = status as any;
        } else if (task.completedQuantity >= task.targetQuantity) {
            task.status = 'Under Review';
            task.completedAt = new Date();
        } else if (task.completedQuantity > 0) {
            task.status = 'In Progress';
        }

        await task.save();
        return task;
    }

    async completeTask(taskId: string) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        task.status = 'Under Review';
        task.completedAt = new Date();
        await task.save();
        return task;
    }

    async verifyTask(taskId: string, status: 'Verified' | 'Completed' | 'Rejected', managerId: string) {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const targetStatus = status === 'Rejected' ? 'Rejected' : 'Verified';
        task.status = targetStatus;
        if (managerId) {
            task.verifiedByManager = managerId as any;
        }
        await task.save();

        // Trigger Notification
        try {
            const batch = await ProductionBatch.findById(task.batchId);
            await notifService.createNotification({
                recipient: task.assignedEmployee.toString(),
                sender: managerId || 'Manager',
                title: targetStatus === 'Verified' ? 'Task Approved' : 'Task Returned for Rework',
                message: targetStatus === 'Verified'
                    ? `Your task '${task.taskName}' was verified & approved by manager.`
                    : `Your task '${task.taskName}' was rejected or returned for rework.`,
                type: 'TASK_STATUS',
                batchId: task.batchId?.toString(),
                taskId: task._id.toString(),
                batchName: batch?.batchName || 'Production Batch',
                taskName: task.taskName,
                priority: task.priority as any,
            });
        } catch (err) {
            console.error('[TaskService] Verify Task Notification Error:', err);
        }

        return task;
    }

    async deleteTask(taskId: string) {
        const task = await Task.findByIdAndDelete(taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    }
}
