import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
    | 'TASK_ASSIGNED'
    | 'TASK_STATUS'
    | 'BATCH_EVENT'
    | 'ATTENDANCE'
    | 'LEAVE'
    | 'ANNOUNCEMENT'
    | 'TICKET'
    | 'SYSTEM'
    | 'TASK';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId | string;
    sender?: mongoose.Types.ObjectId | string;
    title: string;
    message: string;
    type: NotificationType;
    batchId?: mongoose.Types.ObjectId | string;
    taskId?: mongoose.Types.ObjectId | string;
    batchName?: string;
    taskName?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    isRead: boolean;
    read?: boolean;
    referenceId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sender: { type: Schema.Types.Mixed },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: [
                'TASK_ASSIGNED',
                'TASK_STATUS',
                'BATCH_EVENT',
                'ATTENDANCE',
                'LEAVE',
                'ANNOUNCEMENT',
                'TICKET',
                'SYSTEM',
                'TASK',
            ],
            default: 'ANNOUNCEMENT',
        },
        batchId: { type: Schema.Types.ObjectId, ref: 'ProductionBatch' },
        taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
        batchName: { type: String },
        taskName: { type: String },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        isRead: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        referenceId: { type: String },
    },
    { timestamps: true }
);

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
