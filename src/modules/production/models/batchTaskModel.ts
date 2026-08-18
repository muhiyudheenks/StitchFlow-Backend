import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBatchTask extends Document {
    batch: mongoose.Types.ObjectId | string;
    garmentProduct: string;
    operationName: string;
    assignedTo: mongoose.Types.ObjectId | string;
    taskType: 'Stitching' | 'Finishing' | 'General';
    quantity: number;
    completedQuantity: number;
    startDate?: Date;
    dueDate?: Date;
    estimatedDuration?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'In Progress' | 'Quality Check' | 'Completed';
    instructions?: string;
    createdBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const batchTaskSchema = new Schema<IBatchTask>(
    {
        batch: { type: Schema.Types.ObjectId, ref: 'ProductionBatch', required: true },
        garmentProduct: { type: String, required: true, trim: true },
        operationName: { type: String, required: true, trim: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        taskType: {
            type: String,
            enum: ['Stitching', 'Finishing', 'General'],
            default: 'Stitching',
        },
        quantity: { type: Number, required: true, min: 1 },
        completedQuantity: { type: Number, default: 0, min: 0 },
        startDate: { type: Date, default: Date.now },
        dueDate: { type: Date },
        estimatedDuration: { type: String, trim: true },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Quality Check', 'Completed'],
            default: 'Pending',
        },
        instructions: { type: String, trim: true },
        createdBy: { type: Schema.Types.Mixed, default: 'Manager' },
    },
    { timestamps: true }
);

const BatchTask: Model<IBatchTask> =
    mongoose.models.BatchTask ||
    mongoose.model<IBatchTask>('BatchTask', batchTaskSchema);

export default BatchTask;
