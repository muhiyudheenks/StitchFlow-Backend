import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductionBatch extends Document {
    batchName: string;
    batchNumber?: string;
    batchCode?: string;
    productName?: string;
    quantity?: number;
    startDate?: Date;
    expectedEndDate?: Date;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    manager: mongoose.Types.ObjectId | string;
    members: (mongoose.Types.ObjectId | string)[];
    cuttingWorkers?: (mongoose.Types.ObjectId | string)[];
    stitchingWorkers?: (mongoose.Types.ObjectId | string)[];
    finishingWorkers?: (mongoose.Types.ObjectId | string)[];
    notes?: string;
    status: 'UNASSIGNED' | 'PENDING_MANAGER' | 'ASSIGNED' | 'IN_PROGRESS' | 'Active' | 'In Progress' | 'Completed' | 'COMPLETED' | 'On Hold' | 'CANCELLED';
    createdBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const productionBatchSchema = new Schema<IProductionBatch>(
    {
        batchName: { type: String, required: true, trim: true },
        batchNumber: { type: String, trim: true, sparse: true },
        batchCode: { type: String, trim: true },
        productName: { type: String, trim: true },
        quantity: { type: Number, default: 0 },
        startDate: { type: Date },
        expectedEndDate: { type: Date },
        priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
        manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        cuttingWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        stitchingWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        finishingWorkers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        notes: { type: String, trim: true },
        status: {
            type: String,
            enum: ['UNASSIGNED', 'PENDING_MANAGER', 'ASSIGNED', 'IN_PROGRESS', 'Active', 'In Progress', 'Completed', 'COMPLETED', 'On Hold', 'CANCELLED'],
            default: 'Active',
        },
        createdBy: { type: Schema.Types.Mixed, default: 'Admin' },
    },
    { timestamps: true }
);

const ProductionBatch: Model<IProductionBatch> =
    mongoose.models.ProductionBatch ||
    mongoose.model<IProductionBatch>('ProductionBatch', productionBatchSchema);

export default ProductionBatch;
