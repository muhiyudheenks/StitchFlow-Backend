import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductionBatch extends Document {
    batchNumber: string;
    productName: string;
    targetQuantity: number;
    completedQuantity: number;
    line: string;
    startDate?: Date;
    dueDate?: Date;
    status: 'planned' | 'in_production' | 'quality_check' | 'completed';
    createdBy?: mongoose.Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const productionBatchSchema = new Schema<IProductionBatch>(
    {
        batchNumber: { type: String, required: true, unique: true, trim: true },
        productName: { type: String, required: true, trim: true },
        targetQuantity: { type: Number, required: true, min: 1 },
        completedQuantity: { type: Number, default: 0 },
        line: { type: String, default: 'Line A' },
        startDate: { type: Date, default: Date.now },
        dueDate: { type: Date },
        status: {
            type: String,
            enum: ['planned', 'in_production', 'quality_check', 'completed'],
            default: 'planned',
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const ProductionBatch: Model<IProductionBatch> =
    mongoose.models.ProductionBatch ||
    mongoose.model<IProductionBatch>('ProductionBatch', productionBatchSchema);

export default ProductionBatch;
