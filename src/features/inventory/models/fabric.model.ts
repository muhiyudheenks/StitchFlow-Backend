import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFabricItem extends Document {
    fabricId: string;
    fabricName: string;
    fabricType: string;
    gsm: number;
    color: string;
    width: string;
    rollNumber?: string;
    supplier: string;
    purchaseDate: Date;
    unit: 'Meters' | 'Kg';
    currentStock: number;
    minimumStock: number;
    unitCost: number;
    totalValue: number;
    warehouseLocation: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    createdAt: Date;
    updatedAt: Date;
}

const fabricSchema = new Schema<IFabricItem>(
    {
        fabricId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        fabricName: {
            type: String,
            required: [true, 'Fabric name is required'],
            trim: true,
        },
        fabricType: {
            type: String,
            required: [true, 'Fabric type is required'],
            trim: true,
        },
        gsm: {
            type: Number,
            required: [true, 'GSM is required'],
            min: [0, 'GSM cannot be negative'],
        },
        color: {
            type: String,
            required: [true, 'Color is required'],
            trim: true,
        },
        width: {
            type: String,
            required: [true, 'Width is required'],
            trim: true,
        },
        rollNumber: {
            type: String,
            trim: true,
        },
        supplier: {
            type: String,
            required: [true, 'Supplier is required'],
            trim: true,
        },
        purchaseDate: {
            type: Date,
            default: Date.now,
        },
        unit: {
            type: String,
            enum: ['Meters', 'Kg'],
            default: 'Meters',
        },
        currentStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        minimumStock: {
            type: Number,
            required: true,
            min: 0,
            default: 100,
        },
        unitCost: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalValue: {
            type: Number,
            default: 0,
        },
        warehouseLocation: {
            type: String,
            required: [true, 'Warehouse location is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['In Stock', 'Low Stock', 'Out of Stock'],
            default: 'In Stock',
        },
    },
    { timestamps: true }
);

fabricSchema.pre<IFabricItem>('save', function (next) {
    this.totalValue = Number((this.currentStock * this.unitCost).toFixed(2));
    if (this.currentStock <= 0) {
        this.status = 'Out of Stock';
    } else if (this.currentStock <= this.minimumStock) {
        this.status = 'Low Stock';
    } else {
        this.status = 'In Stock';
    }
    next();
});

const FabricItem: Model<IFabricItem> = mongoose.model<IFabricItem>('FabricItem', fabricSchema);

export default FabricItem;
