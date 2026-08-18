import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInventory extends Document {
    itemName: string;
    category: string;
    stockQuantity: number;
    minStockLevel: number;
    unit: string;
    price: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
    {
        itemName: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            default: 'General',
        },
        stockQuantity: {
            type: Number,
            required: [true, 'Stock quantity is required'],
            min: [0, 'Stock quantity cannot be negative'],
            default: 0,
        },
        minStockLevel: {
            type: Number,
            required: [true, 'Minimum stock level is required'],
            min: [0, 'Minimum stock level cannot be negative'],
            default: 10,
        },
        unit: {
            type: String,
            default: 'pcs',
            trim: true,
        },
        price: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative'],
        },
        status: {
            type: String,
            enum: ['in_stock', 'low_stock', 'out_of_stock'],
            default: 'in_stock',
        },
        description: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

inventorySchema.pre<IInventory>('save', function (next) {
    if (this.stockQuantity <= 0) {
        this.status = 'out_of_stock';
    } else if (this.stockQuantity <= this.minStockLevel) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    next();
});

const Inventory: Model<IInventory> = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
