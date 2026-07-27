import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
    batchId: mongoose.Types.ObjectId | string;
    assignedEmployee: mongoose.Types.ObjectId | string;
    taskName: string;
    operationType?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    targetQuantity: number;
    completedQuantity: number;
    status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Rejected';
    description?: string;
    dueDate?: Date;
    startedAt?: Date;
    completedAt?: Date;
    verifiedByManager?: mongoose.Types.ObjectId | string;
    createdBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
    {
        batchId: { type: Schema.Types.ObjectId, ref: 'ProductionBatch', required: true },
        assignedEmployee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        taskName: { type: String, required: true, trim: true },
        operationType: { type: String, default: 'Stitching' },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        targetQuantity: { type: Number, required: true, min: 1 },
        completedQuantity: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Under Review', 'Completed', 'Rejected'],
            default: 'Pending',
        },
        description: { type: String, trim: true },
        dueDate: { type: Date },
        startedAt: { type: Date },
        completedAt: { type: Date },
        verifiedByManager: { type: Schema.Types.ObjectId, ref: 'User' },
        createdBy: { type: Schema.Types.Mixed, default: 'Manager' },
    },
    { timestamps: true }
);

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
export default Task;
