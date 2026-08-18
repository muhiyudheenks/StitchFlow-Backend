import mongoose, { Schema, Document } from 'mongoose';

export interface IGarmentProduct extends Document {
    productName: string;
    productCode: string;
    category: string;
    description?: string;
    defaultTargetQuantity?: number;
    status: 'Active' | 'Inactive';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const garmentProductSchema = new Schema<IGarmentProduct>(
    {
        productName: {
            type: String,
            required: [true, 'Product Name is required'],
            trim: true,
        },
        productCode: {
            type: String,
            required: [true, 'Product Code is required'],
            trim: true,
            uppercase: true,
        },
        category: {
            type: String,
            required: [true, 'Product Category is required'],
            trim: true,
            default: 'Shirt',
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        defaultTargetQuantity: {
            type: Number,
            default: 100,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Case-insensitive index on productName
garmentProductSchema.index({ productName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
garmentProductSchema.index({ productCode: 1 }, { unique: true });

export default mongoose.model<IGarmentProduct>('GarmentProduct', garmentProductSchema);
