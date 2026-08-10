import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivity extends Document {
    userId?: mongoose.Types.ObjectId;
    userName: string;
    userRole: string;
    action: string;
    module: 'Employee' | 'Manager' | 'Production' | 'Inventory' | 'Attendance' | 'System';
    details?: string;
    timestamp: Date;
}

const activitySchema = new Schema<IActivity>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        userName: {
            type: String,
            required: true,
            default: 'System',
        },
        userRole: {
            type: String,
            required: true,
            default: 'admin',
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        module: {
            type: String,
            enum: ['Employee', 'Manager', 'Production', 'Inventory', 'Attendance', 'System'],
            required: true,
        },
        details: {
            type: String,
            trim: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);

export default Activity;
