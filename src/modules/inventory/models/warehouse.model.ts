import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWarehouse extends Document {
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
    {
        name: {
            type: String,
            required: [true, 'Warehouse name is required'],
            unique: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const Warehouse: Model<IWarehouse> = mongoose.model<IWarehouse>('Warehouse', warehouseSchema);

export default Warehouse;
