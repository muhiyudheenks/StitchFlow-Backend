import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGarmentItem extends Document {
    productId: string;
    productName: string;
    styleNumber: string;
    category: string;
    size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;
    color: string;
    quantityAvailable: number;
    quantityReserved: number;
    totalQuantity: number;
    productionDate: Date;
    warehouse: string;
    unitCost: number;
    sellingPrice: number;
    status: 'Ready' | 'Reserved' | 'Dispatched';
    createdAt: Date;
    updatedAt: Date;
}

const garmentSchema = new Schema<IGarmentItem>(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        styleNumber: {
            type: String,
            required: [true, 'Style number is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        size: {
            type: String,
            required: [true, 'Size is required'],
            trim: true,
        },
        color: {
            type: String,
            required: [true, 'Color is required'],
            trim: true,
        },
        quantityAvailable: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        quantityReserved: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalQuantity: {
            type: Number,
            default: 0,
        },
        productionDate: {
            type: Date,
            default: Date.now,
        },
        warehouse: {
            type: String,
            required: [true, 'Warehouse location is required'],
            trim: true,
        },
        unitCost: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ['Ready', 'Reserved', 'Dispatched'],
            default: 'Ready',
        },
    },
    { timestamps: true }
);

garmentSchema.pre<IGarmentItem>('save', function (next) {
    this.totalQuantity = this.quantityAvailable + this.quantityReserved;
    next();
});

const GarmentItem: Model<IGarmentItem> = mongoose.model<IGarmentItem>('GarmentItem', garmentSchema);

export default GarmentItem;
