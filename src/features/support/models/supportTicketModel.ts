import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupportTicket extends Document {
    employeeId?: mongoose.Types.ObjectId | string;
    managerId?: mongoose.Types.ObjectId | string;
    createdBy: mongoose.Types.ObjectId | string;
    role: 'employee' | 'manager';
    category: string;
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    attachment?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    assignedAdmin?: mongoose.Types.ObjectId | string;
    resolution?: string;
    internalNotes?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['employee', 'manager'], required: true },
        category: { type: String, required: true, trim: true },
        subject: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium',
        },
        attachment: { type: String, trim: true },
        status: {
            type: String,
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            default: 'OPEN',
        },
        assignedAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
        resolution: { type: String, trim: true },
        internalNotes: { type: String, trim: true },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

const SupportTicket: Model<ISupportTicket> =
    mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);

export default SupportTicket;
