import ProductionBatch from '../models/productionBatchModel';
import Task from '../../manager/models/taskModel';
import User from '../../auth/models/userModel';

export class ProductionService {
    async getProductionBatches(role?: string, userId?: string) {
        let filter: any = {};
        if (role === 'manager' && userId) {
            filter = {
                $or: [
                    { manager: userId },
                    { status: { $in: ['UNASSIGNED', 'PENDING_MANAGER'] } },
                ],
            };
        } else if (role === 'employee' && userId) {
            filter = { members: userId };
        }

        const batches = await ProductionBatch.find(filter)
            .populate('manager', 'fullName email designation department')
            .populate('members', 'fullName email designation department')
            .sort({ createdAt: -1 });

        return await Promise.all(
            batches.map(async (b: any) => {
                const tasks = await Task.find({ batchId: b._id })
                    .populate('assignedEmployee', 'fullName email designation department')
                    .sort({ createdAt: -1 });

                const totalTasks = tasks.length;
                const completedTasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
                const pendingTasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'in_progress').length;
                const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Dynamically build members list from tasks & members array
                const taskEmployeesMap = new Map();
                if (Array.isArray(b.members)) {
                    b.members.forEach((m: any) => {
                        if (m && m._id) {
                            taskEmployeesMap.set(m._id.toString(), {
                                id: m._id.toString(),
                                name: m.fullName || m.name,
                                email: m.email || '',
                                department: m.department || 'Production',
                                designation: m.designation || 'Operator',
                            });
                        }
                    });
                }

                tasks.forEach((t: any) => {
                    const emp = t.assignedEmployee;
                    if (emp && emp._id && !taskEmployeesMap.has(emp._id.toString())) {
                        taskEmployeesMap.set(emp._id.toString(), {
                            id: emp._id.toString(),
                            name: emp.fullName || emp.name,
                            email: emp.email || '',
                            department: emp.department || 'Production',
                            designation: emp.designation || 'Operator',
                        });
                    }
                });

                const membersList = Array.from(taskEmployeesMap.values());

                return {
                    ...b.toObject(),
                    id: b._id.toString(),
                    managerName: (b.manager as any)?.fullName || 'Unassigned',
                    members: membersList,
                    membersCount: membersList.length,
                    tasks: tasks.map((t: any) => ({
                        ...t.toObject(),
                        id: t._id.toString(),
                        assignedToName: (t.assignedEmployee as any)?.fullName || 'Unassigned',
                    })),
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    progressPercentage,
                };
            })
        );
    }

    async getProductionBatchById(id: string) {
        const b = await ProductionBatch.findById(id)
            .populate('manager', 'fullName email designation department')
            .populate('members', 'fullName email designation department');

        if (!b) {
            throw new Error('Production batch not found');
        }

        const tasks = await Task.find({ batchId: b._id })
            .populate('assignedEmployee', 'fullName email designation department')
            .sort({ createdAt: -1 });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
        const pendingTasks = tasks.filter((t) => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'in_progress').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const taskEmployeesMap = new Map();
        if (Array.isArray(b.members)) {
            b.members.forEach((m: any) => {
                if (m && m._id) {
                    taskEmployeesMap.set(m._id.toString(), {
                        id: m._id.toString(),
                        name: m.fullName || m.name,
                        email: m.email || '',
                        department: m.department || 'Production',
                        designation: m.designation || 'Operator',
                    });
                }
            });
        }

        tasks.forEach((t: any) => {
            const emp = t.assignedEmployee;
            if (emp && emp._id && !taskEmployeesMap.has(emp._id.toString())) {
                taskEmployeesMap.set(emp._id.toString(), {
                    id: emp._id.toString(),
                    name: emp.fullName || emp.name,
                    email: emp.email || '',
                    department: emp.department || 'Production',
                    designation: emp.designation || 'Operator',
                });
            }
        });

        const membersList = Array.from(taskEmployeesMap.values());

        return {
            ...b.toObject(),
            id: b._id.toString(),
            managerName: (b.manager as any)?.fullName || 'Unassigned',
            members: membersList,
            membersCount: membersList.length,
            tasks: tasks.map((t: any) => ({
                ...t.toObject(),
                id: t._id.toString(),
                assignedToName: (t.assignedEmployee as any)?.fullName || 'Unassigned',
            })),
            totalTasks,
            completedTasks,
            pendingTasks,
            progressPercentage,
        };
    }

    async createProductionBatch(data: any, createdBy: string) {
        const batchName = data.batchName ? data.batchName.trim() : '';
        if (!batchName) {
            throw new Error('Batch Name is required');
        }

        const managerId = data.managerId || data.manager;
        if (!managerId) {
            throw new Error('Batch Manager is required');
        }

        // Unique Batch Name Check
        const existingBatch = await ProductionBatch.findOne({ batchName });
        if (existingBatch) {
            throw new Error(`Production batch name '${batchName}' already exists`);
        }

        // Manager Existence Check
        const managerUser = await User.findById(managerId);
        if (!managerUser) {
            throw new Error('Assigned manager does not exist in user directory');
        }

        const batch = new ProductionBatch({
            batchName,
            manager: managerId,
            members: [],
            notes: data.notes || '',
            status: data.status || 'PENDING_MANAGER',
            createdBy,
        });

        await batch.save();

        const populatedBatch = await ProductionBatch.findById(batch._id)
            .populate('manager', 'fullName email designation department');

        return {
            ...populatedBatch?.toObject(),
            id: batch._id.toString(),
            managerName: (populatedBatch?.manager as any)?.fullName || 'Unassigned',
            members: [],
            membersCount: 0,
            tasks: [],
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            progressPercentage: 0,
        };
    }

    async updateProductionBatch(id: string, updateData: any) {
        const managerId = updateData.managerId || updateData.manager;
        if (managerId) {
            updateData.manager = managerId;
        }

        const batch = await ProductionBatch.findByIdAndUpdate(id, updateData, { new: true })
            .populate('manager', 'fullName email designation department')
            .populate('members', 'fullName email designation department');

        if (!batch) {
            throw new Error('Production batch not found');
        }

        return {
            ...batch.toObject(),
            id: batch._id.toString(),
            managerName: (batch.manager as any)?.fullName || 'Unassigned',
            membersCount: Array.isArray(batch.members) ? batch.members.length : 0,
        };
    }
}
