import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInventoryTransaction extends Document {
    date: Date;
    item: string;
    itemType: 'Fabric' | 'Thread' | 'Finished Garment';
    quantity: number;
    movementType: 'Purchase' | 'Production' | 'Adjustment' | 'Return';
    user: string;
    notes?: string;
    createdAt: Date;
}

const transactionSchema = new Schema<IInventoryTransaction>(
    {
        date: {
            type: Date,
            default: Date.now,
        },
        item: {
            type: String,
            required: [true, 'Item name/code is required'],
            trim: true,
        },
        itemType: {
            type: String,
            enum: ['Fabric', 'Thread', 'Finished Garment'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        movementType: {
            type: String,
            enum: ['Purchase', 'Production', 'Adjustment', 'Return'],
            required: true,
        },
        user: {
            type: String,
            required: true,
            trim: true,
            default: 'System Admin',
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const InventoryTransaction: Model<IInventoryTransaction> = mongoose.model<IInventoryTransaction>(
    'InventoryTransaction',
    transactionSchema
);

export default InventoryTransaction;
