import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveRequest extends Document {
    employeeId: mongoose.Types.ObjectId | string;
    leaveType: 'casual' | 'sick' | 'annual';
    startDate: Date;
    endDate: Date;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        leaveType: {
            type: String,
            enum: ['casual', 'sick', 'annual'],
            default: 'casual',
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const LeaveRequest: Model<ILeaveRequest> =
    mongoose.models.LeaveRequest ||
    mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;
