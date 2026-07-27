import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductionBatch extends Document {
    batchName: string;
    manager: mongoose.Types.ObjectId | string;
    members: (mongoose.Types.ObjectId | string)[];
    stitchingWorkers?: (mongoose.Types.ObjectId | string)[];
    finishingWorkers?: (mongoose.Types.ObjectId | string)[];
    notes?: string;
    status: 'UNASSIGNED' | 'PENDING_MANAGER' | 'ASSIGNED' | 'IN_PROGRESS' | 'Active' | 'In Progress' | 'Completed' | 'On Hold';
    createdBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const productionBatchSchema = new Schema<IProductionBatch>(
    {
        batchName: { type: String, required: true, unique: true, trim: true },
        manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        stitchingWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        finishingWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        notes: { type: String, trim: true },
        status: {
            type: String,
            enum: ['UNASSIGNED', 'PENDING_MANAGER', 'ASSIGNED', 'IN_PROGRESS', 'Active', 'In Progress', 'Completed', 'On Hold'],
            default: 'PENDING_MANAGER',
        },
        createdBy: { type: Schema.Types.Mixed, default: 'Admin' },
    },
    { timestamps: true }
);

const ProductionBatch: Model<IProductionBatch> =
    mongoose.models.ProductionBatch ||
    mongoose.model<IProductionBatch>('ProductionBatch', productionBatchSchema);

export default ProductionBatch;
