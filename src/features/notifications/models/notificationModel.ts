import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId | string;
    sender?: mongoose.Types.ObjectId | string;
    title: string;
    message: string;
    type: 'TICKET' | 'SYSTEM' | 'ATTENDANCE' | 'TASK' | 'ANNOUNCEMENT';
    read: boolean;
    referenceId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['TICKET', 'SYSTEM', 'ATTENDANCE', 'TASK', 'ANNOUNCEMENT'],
            default: 'TICKET',
        },
        read: { type: Boolean, default: false },
        referenceId: { type: String },
    },
    { timestamps: true }
);

const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
