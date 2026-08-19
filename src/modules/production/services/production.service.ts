import mongoose from 'mongoose';
import ProductionBatch from '../models/productionBatchModel';
import Task from '../../tasks/models/taskModel';
import User from '../../auth/models/userModel';
import * as notifService from '../../notifications/services/notifications.service';
import * as repo from '../repositories/production.repository';
import * as activityRepo from '../../dashboard/repositories/activity.repository';
import { CreateProductionDto, UpdateProductionDto } from '../../user/dto/admin.dto';
import { PaginationQuery } from '../../user/types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../../user/utils/admin.utils';

export async function generateNextBatchNumber(): Promise<string> {
    const count = await ProductionBatch.countDocuments();
    const candidate = `BATCH-${(count + 1).toString().padStart(4, '0')}`;
    const exists = await ProductionBatch.findOne({
        $or: [{ batchNumber: candidate }, { batchCode: candidate }]
    });
    if (exists) {
        return `BATCH-${count + 1}-${Date.now().toString().slice(-4)}`;
    }
    return candidate;
}

export async function getAvailableEmployees(workerType?: string) {
    const activeStatuses = ['Active', 'In Progress', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_MANAGER'];

    const activeBatches = await ProductionBatch.find({ status: { $in: activeStatuses } });
    const busyEmployeeIdsSet = new Set<string>();

    activeBatches.forEach((b: any) => {
        if (Array.isArray(b.members)) {
            b.members.forEach((m: any) => {
                if (m) busyEmployeeIdsSet.add(m.toString());
            });
        }
    });

    const busyIds = Array.from(busyEmployeeIdsSet);

    const query: any = {
        role: 'employee',
        isBlock: { $ne: true },
        _id: { $nin: busyIds },
    };

    if (workerType) {
        const wtLower = workerType.toLowerCase();
        if (wtLower.includes('cutting')) {
            query.$or = [{ employeeType: 'cutting_worker' }, { employeeType: 'CUTTING_WORKER' }, { designation: { $regex: /cutting/i } }];
        } else if (wtLower.includes('finishing')) {
            query.$or = [{ employeeType: 'finishing_worker' }, { employeeType: 'FINISHING_WORKER' }, { designation: { $regex: /finishing/i } }];
        } else {
            query.$or = [{ employeeType: 'stitching_worker' }, { employeeType: 'STITCHING_WORKER' }, { designation: { $regex: /stitching/i } }];
        }
    }

    const employees = await User.find(query).select('fullName email designation department employeeType status');

    return employees.map((emp) => ({
        id: emp._id.toString(),
        _id: emp._id.toString(),
        name: emp.fullName,
        fullName: emp.fullName,
        email: emp.email,
        employeeId: `EMP-${emp._id.toString().slice(-4).toUpperCase()}`,
        department: emp.department || 'Production',
        designation: emp.designation || 'Operator',
        employeeType: emp.employeeType || 'stitching_worker',
        status: emp.status || 'active',
        availabilityStatus: 'Active & Available',
    }));
}

export async function getProductionBatches(role?: string, userId?: string) {
    let filter: any = {};
    if (role === 'manager' && userId) {
        const userObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;
        filter = {
            $or: [
                { manager: userObjectId },
                { manager: userId.toString() },
            ],
        };
    } else if (role === 'employee' && userId) {
        const userObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;
        filter = {
            $or: [
                { members: userObjectId },
                { members: userId.toString() },
            ],
        };
    }

    const batches = await ProductionBatch.find(filter)
        .populate('manager', 'fullName email designation department')
        .populate('members', 'fullName email designation department employeeType status')
        .populate('cuttingWorkers', 'fullName email designation department employeeType status')
        .populate('stitchingWorkers', 'fullName email designation department employeeType status')
        .populate('finishingWorkers', 'fullName email designation department employeeType status')
        .sort({ createdAt: -1 });

    return await Promise.all(
        batches.map(async (b: any) => {
            const tasks = await Task.find({ batchId: b._id })
                .populate('assignedEmployee', 'fullName email designation department employeeType')
                .sort({ createdAt: -1 });

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter((t: any) => {
                const s = (t.status || '').toLowerCase();
                return s === 'completed' || s === 'verified';
            }).length;
            const pendingTasks = tasks.filter((t: any) => {
                const s = (t.status || '').toLowerCase();
                return s === 'pending' || s === 'in_progress' || s === 'under_review' || s === 'under review';
            }).length;
            const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const cuttingIds = new Set(
                Array.isArray(b.cuttingWorkers) ? b.cuttingWorkers.map((cw: any) => (cw._id || cw.id || cw).toString()) : []
            );
            const finishingIds = new Set(
                Array.isArray(b.finishingWorkers) ? b.finishingWorkers.map((fw: any) => (fw._id || fw.id || fw).toString()) : []
            );
            const stitchingIds = new Set(
                Array.isArray(b.stitchingWorkers) ? b.stitchingWorkers.map((sw: any) => (sw._id || sw.id || sw).toString()) : []
            );

            const getWorkerCategory = (empId: string, emp: any, defaultCategory: string) => {
                if (cuttingIds.has(empId)) return 'Cutting Worker';
                if (finishingIds.has(empId)) return 'Finishing Worker';
                if (stitchingIds.has(empId)) return 'Stitching Worker';
                if (defaultCategory && defaultCategory !== 'Worker') return defaultCategory;
                const desig = (emp?.designation || emp?.employeeType || '').toLowerCase();
                if (desig.includes('cutting')) return 'Cutting Worker';
                if (desig.includes('finishing')) return 'Finishing Worker';
                return 'Stitching Worker';
            };

            const formatWorker = (m: any, defaultDesig: string) => {
                const empId = m._id?.toString() || m.toString();
                const category = getWorkerCategory(empId, m, defaultDesig);
                return {
                    id: empId,
                    _id: empId,
                    name: m.fullName || m.name || 'Employee',
                    fullName: m.fullName || m.name || 'Employee',
                    email: m.email || '',
                    employeeId: m._id ? `EMP-${empId.slice(-4).toUpperCase()}` : 'EMP-0000',
                    department: m.department || 'Production',
                    designation: m.designation || defaultDesig,
                    workerType: category,
                    workerCategory: category,
                    status: m.status || 'active',
                };
            };

            const membersList = Array.isArray(b.members) ? b.members.map((m: any) => formatWorker(m, 'Worker')) : [];
            const cuttingWorkersList = Array.isArray(b.cuttingWorkers) ? b.cuttingWorkers.map((m: any) => formatWorker(m, 'Cutting Worker')) : [];
            const stitchingWorkersList = Array.isArray(b.stitchingWorkers) ? b.stitchingWorkers.map((m: any) => formatWorker(m, 'Stitching Worker')) : [];
            const finishingWorkersList = Array.isArray(b.finishingWorkers) ? b.finishingWorkers.map((m: any) => formatWorker(m, 'Finishing Worker')) : [];

            const batchCodeVal = b.batchNumber || b.batchCode || 'BATCH-' + b._id.toString().slice(-4);

            return {
                ...b.toObject(),
                id: b._id.toString(),
                batchNumber: batchCodeVal,
                batchCode: batchCodeVal,
                managerName: (b.manager as any)?.fullName || 'Unassigned',
                members: membersList,
                membersCount: membersList.length,
                cuttingWorkers: cuttingWorkersList,
                stitchingWorkers: stitchingWorkersList,
                finishingWorkers: finishingWorkersList,
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

export async function getProductionBatchById(id: string) {
    const batches = await getProductionBatches();
    const batch = batches.find((b) => b.id === id || b._id?.toString() === id);
    if (!batch) {
        throw new Error('Production batch not found');
    }
    return batch;
}

export async function addMemberToBatch(batchId: string, employeeInput: string | string[], workerType: 'Cutting' | 'Stitching' | 'Finishing') {
    const employeeIds = Array.isArray(employeeInput) ? employeeInput : [employeeInput];
    if (employeeIds.length === 0) {
        throw new Error('No employee IDs provided for batch allocation');
    }

    const batch = await ProductionBatch.findById(batchId);
    if (!batch) {
        throw new Error('Production batch not found');
    }

    if (batch.status === 'Completed' || batch.status === 'COMPLETED') {
        throw new Error('Cannot modify members of a completed batch');
    }

    const activeStatuses = ['Active', 'In Progress', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_MANAGER'];

    for (const empId of employeeIds) {
        const employee = await User.findById(empId);
        if (!employee) {
            throw new Error(`Employee with ID ${empId} not found`);
        }

        const otherActiveBatch = await ProductionBatch.findOne({
            _id: { $ne: batchId },
            status: { $in: activeStatuses },
            members: empId,
        });

        if (otherActiveBatch) {
            throw new Error(`Employee '${employee.fullName}' is already assigned to another active batch (${otherActiveBatch.batchName})`);
        }
    }

    const updateQuery: any = {
        $addToSet: { members: { $each: employeeIds } },
    };

    if (workerType === 'Cutting') {
        updateQuery.$addToSet.cuttingWorkers = { $each: employeeIds };
    } else if (workerType === 'Finishing') {
        updateQuery.$addToSet.finishingWorkers = { $each: employeeIds };
    } else {
        updateQuery.$addToSet.stitchingWorkers = { $each: employeeIds };
    }

    await ProductionBatch.findByIdAndUpdate(batchId, updateQuery, { new: true });

    try {
        for (const empId of employeeIds) {
            await notifService.createNotification({
                recipient: empId.toString(),
                sender: batch.manager?.toString() || 'Manager',
                title: 'Added to Production Batch',
                message: `You have been allocated to production batch '${batch.batchName}' as a ${workerType} worker.`,
                type: 'BATCH_EVENT',
                batchId: batch._id.toString(),
                batchName: batch.batchName,
                priority: 'Medium',
            });
        }
    } catch (err) {
        console.error('[ProductionService] Add Member Notification Error:', err);
    }

    return await getProductionBatchById(batchId);
}

export async function removeMemberFromBatch(batchId: string, employeeId: string) {
    const batch = await ProductionBatch.findById(batchId);
    if (!batch) {
        throw new Error('Production batch not found');
    }

    if (batch.status === 'Completed' || batch.status === 'COMPLETED') {
        throw new Error('Cannot remove members from a completed batch');
    }

    await ProductionBatch.findByIdAndUpdate(batchId, {
        $pull: {
            members: employeeId,
            cuttingWorkers: employeeId,
            stitchingWorkers: employeeId,
            finishingWorkers: employeeId,
        },
    });

    try {
        await notifService.createNotification({
            recipient: employeeId.toString(),
            sender: batch.manager?.toString() || 'Manager',
            title: 'Removed from Production Batch',
            message: `You have been removed from production batch '${batch.batchName}'.`,
            type: 'BATCH_EVENT',
            batchId: batch._id.toString(),
            batchName: batch.batchName,
            priority: 'Low',
        });
    } catch (err) {
        console.error('[ProductionService] Remove Member Notification Error:', err);
    }

    return await getProductionBatchById(batchId);
}

export async function completeBatch(batchId: string) {
    const batch = await ProductionBatch.findById(batchId);
    if (!batch) {
        throw new Error('Production batch not found');
    }

    const tasks = await Task.find({ batchId });
    const uncompletedTasks = tasks.filter((t: any) => {
        const s = (t.status || '').toLowerCase();
        return s !== 'completed' && s !== 'verified';
    });

    if (uncompletedTasks.length > 0) {
        throw new Error(`Cannot complete batch. ${uncompletedTasks.length} task(s) are not yet completed and approved by the manager.`);
    }

    batch.status = 'Completed';
    await batch.save();

    try {
        const members = Array.isArray(batch.members) ? batch.members : [];
        for (const memberId of members) {
            if (memberId) {
                await notifService.createNotification({
                    recipient: memberId.toString(),
                    sender: batch.manager?.toString() || 'Manager',
                    title: 'Production Batch Completed',
                    message: `Production batch '${batch.batchName}' has been marked as Completed. All tasks fulfilled!`,
                    type: 'BATCH_EVENT',
                    batchId: batch._id.toString(),
                    batchName: batch.batchName,
                    priority: 'High',
                });
            }
        }
    } catch (err) {
        console.error('[ProductionService] Complete Batch Notification Error:', err);
    }

    return await getProductionBatchById(batchId);
}

export async function createProductionBatch(data: any, createdBy: string) {
    const batchName = data.batchName ? data.batchName.trim() : '';
    if (!batchName) {
        throw new Error('Batch Name is required');
    }

    const managerId = data.managerId || data.manager;
    if (!managerId) {
        throw new Error('Batch Manager is required');
    }

    const existingBatch = await ProductionBatch.findOne({ batchName });
    if (existingBatch) {
        throw new Error(`Production batch name '${batchName}' already exists`);
    }

    const managerUser = await User.findById(managerId);
    if (!managerUser) {
        throw new Error('Assigned manager does not exist in user directory');
    }

    const managerObjectId = mongoose.Types.ObjectId.isValid(managerId)
        ? new mongoose.Types.ObjectId(managerId)
        : managerId;

    const generatedNum = data.batchNumber || data.batchCode || await generateNextBatchNumber();

    const batch = new ProductionBatch({
        batchName,
        batchNumber: generatedNum,
        batchCode: generatedNum,
        productName: data.productName || data.garmentProduct || 'Denim Apparel',
        quantity: Number(data.quantity || 100),
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expectedEndDate: data.expectedEndDate || data.dueDate ? new Date(data.expectedEndDate || data.dueDate) : undefined,
        priority: data.priority || 'Medium',
        manager: managerObjectId,
        members: [],
        cuttingWorkers: [],
        stitchingWorkers: [],
        finishingWorkers: [],
        notes: data.notes || '',
        status: data.status || 'Active',
        createdBy: createdBy || 'Admin',
    });

    await batch.save();

    return await getProductionBatchById(batch._id.toString());
}

export async function updateProductionBatch(id: string, updateData: any) {
    const managerId = updateData.managerId || updateData.manager;
    if (managerId) {
        updateData.manager = mongoose.Types.ObjectId.isValid(managerId)
            ? new mongoose.Types.ObjectId(managerId)
            : managerId;
    }

    const batch = await ProductionBatch.findByIdAndUpdate(id, updateData, { new: true });
    if (!batch) {
        throw new Error('Production batch not found');
    }

    return await getProductionBatchById(id);
}

export async function deleteProductionBatch(id: string) {
    const batch = await ProductionBatch.findByIdAndDelete(id);
    if (!batch) {
        throw new Error('Production batch not found');
    }
    await Task.deleteMany({ batchId: id });
    return batch;
}

export async function createProduction(dto: CreateProductionDto, adminName: string = 'Admin') {
    const production = await repo.createProductionRepo(dto);
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Created production task '${production.title}'`,
        'Production',
        `Target: ${production.targetQuantity}`
    );
    return production;
}

export async function getProductions(query: PaginationQuery) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter: any = {};

    if (query.search) {
        filter.title = { $regex: query.search, $options: 'i' };
    }

    if (query.status) {
        filter.status = query.status;
    }

    const { productions, total } = await repo.findAllProductions(filter, skip, limit);
    const pagination = buildPaginationMeta(total, page, limit);

    return {
        productions,
        pagination,
    };
}

export async function getProductionById(id: string) {
    const production = await repo.findProductionById(id);
    if (!production) {
        throw new Error('Production task not found');
    }
    return production;
}

export async function updateProduction(id: string, dto: UpdateProductionDto, adminName: string = 'Admin') {
    const production = await repo.updateProductionRepo(id, dto);
    if (!production) {
        throw new Error('Production task not found');
    }

    if (production.completedQuantity >= production.targetQuantity && production.status !== 'completed') {
        production.status = 'completed';
        await production.save();
    }

    await activityRepo.logActivity(
        adminName,
        'admin',
        `Updated production task '${production.title}'`,
        'Production'
    );
    return production;
}

export async function deleteProduction(id: string, adminName: string = 'Admin') {
    const production = await repo.deleteProductionRepo(id);
    if (!production) {
        throw new Error('Production task not found');
    }
    await activityRepo.logActivity(
        adminName,
        'admin',
        `Deleted production task '${production.title}'`,
        'Production'
    );
    return { id };
}

export async function getTodayProduction() {
    return await repo.findTodayProduction();
}

export async function getTarget() {
    const stats = await repo.aggregateStats();
    const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
    return { totalTarget };
}

export async function getCompleted() {
    const stats = await repo.aggregateStats();
    const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
    return { totalCompleted };
}

export async function getRemaining() {
    const stats = await repo.aggregateStats();
    const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
    const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
    return { totalRemaining: Math.max(0, totalTarget - totalCompleted) };
}

export async function getEfficiency() {
    const stats = await repo.aggregateStats();
    const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
    const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;
    const efficiency = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;
    return {
        totalTarget,
        totalCompleted,
        efficiencyPercentage: efficiency,
    };
}

export const productionService = {
    generateNextBatchNumber,
    getAvailableEmployees,
    getProductionBatches,
    getProductionBatchById,
    addMemberToBatch,
    removeMemberFromBatch,
    completeBatch,
    createProductionBatch,
    updateProductionBatch,
    deleteProductionBatch,
    createProduction,
    getProductions,
    getProductionById,
    updateProduction,
    deleteProduction,
    getTodayProduction,
    getTarget,
    getCompleted,
    getRemaining,
    getEfficiency,
};
