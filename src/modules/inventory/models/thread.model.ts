import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IThreadItem extends Document {
    threadId: string;
    threadType: string;
    color: string;
    brand: string;
    supplier: string;
    unit: 'Spools' | 'Cones' | 'Yards';
    currentStock: number;
    minimumStock: number;
    unitCost: number;
    totalValue: number;
    warehouse: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    createdAt: Date;
    updatedAt: Date;
}

const threadSchema = new Schema<IThreadItem>(
    {
        threadId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        threadType: {
            type: String,
            required: [true, 'Thread type is required'],
            trim: true,
        },
        color: {
            type: String,
            required: [true, 'Color is required'],
            trim: true,
        },
        brand: {
            type: String,
            required: [true, 'Brand is required'],
            trim: true,
        },
        supplier: {
            type: String,
            required: [true, 'Supplier is required'],
            trim: true,
        },
        unit: {
            type: String,
            enum: ['Spools', 'Cones', 'Yards'],
            default: 'Spools',
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
            default: 50,
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
        warehouse: {
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

threadSchema.pre<IThreadItem>('save', function (next) {
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

const ThreadItem: Model<IThreadItem> = mongoose.model<IThreadItem>('ThreadItem', threadSchema);

export default ThreadItem;
