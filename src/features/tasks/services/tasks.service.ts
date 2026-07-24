import Task from '../models/taskModel';

export class TaskService {
    async getAllTasks(department?: string) {
        const tasks = await Task.find().populate('assignedTo', 'fullName email').sort({ createdAt: -1 });
        if (tasks.length === 0) {
            return [
                { id: 't1', title: 'Inspect Denim Fabric Roll #409', description: 'Check weave density and color shade variance.', priority: 'high', status: 'in_progress', assignee: 'John Doe', deadline: '2026-07-25', department: 'Cutting', progress: 70 },
                { id: 't2', title: 'Calibrate Sewing Machine #12', description: 'Routine maintenance for needle alignment.', priority: 'medium', status: 'pending', assignee: 'Jane Smith', deadline: '2026-07-26', department: 'Assembly', progress: 0 },
                { id: 't3', title: 'Quality Check Batch #BT-889', description: 'Inspect seam strength and zipper durability.', priority: 'urgent', status: 'completed', assignee: 'Robert Vance', deadline: '2026-07-24', department: 'Quality', progress: 100 },
            ];
        }
        return tasks.map((t) => ({
            id: t._id.toString(),
            title: t.title,
            description: t.description || '',
            priority: t.priority,
            status: t.status,
            assignee: (t.assignedTo as any)?.fullName || 'Unassigned',
            deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : 'N/A',
            department: t.department || 'General',
            progress: t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0,
        }));
    }

    async createTask(data: any, createdBy: string) {
        const task = await Task.create({
            title: data.title,
            description: data.description,
            priority: data.priority || 'medium',
            status: 'pending',
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            department: data.department || 'Production',
            createdBy,
            assignedTo: data.assignedTo || undefined,
        });
        return task;
    }

    async updateTask(taskId: string, updateData: any) {
        const task = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
        return task;
    }
}
