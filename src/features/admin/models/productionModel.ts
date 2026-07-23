import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProduction extends Document {
    title: string;
    targetQuantity: number;
    completedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    managerId?: mongoose.Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const productionSchema = new Schema<IProduction>(
    {
        title: {
            type: String,
            required: [true, 'Production title is required'],
            trim: true,
        },
        targetQuantity: {
            type: Number,
            required: [true, 'Target quantity is required'],
            min: [0, 'Target quantity cannot be negative'],
        },
        completedQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Completed quantity cannot be negative'],
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'delayed'],
            default: 'pending',
        },
        managerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const Production: Model<IProduction> = mongoose.model<IProduction>('Production', productionSchema);

export default Production;
