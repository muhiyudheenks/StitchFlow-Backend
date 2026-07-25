import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProductionLine extends Document {
    name: string;
    code?: string;
    managerId?: mongoose.Types.ObjectId | string | null;
    targetPerDay: number;
    status: 'active' | 'maintenance' | 'inactive';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    toPublicJSON(): Record<string, any>;
}

const productionLineSchema = new Schema<IProductionLine>(
    {
        name: {
            type: String,
            required: [true, 'Production line name is required'],
            trim: true,
        },
        code: {
            type: String,
            trim: true,
            default: '',
        },
        managerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        targetPerDay: {
            type: Number,
            default: 0,
            min: [0, 'Target per day cannot be negative'],
        },
        status: {
            type: String,
            enum: ['active', 'maintenance', 'inactive'],
            default: 'active',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

productionLineSchema.methods.toPublicJSON = function (this: IProductionLine) {
    let manager = null;
    if (this.managerId) {
        if (typeof this.managerId === 'object' && '_id' in this.managerId) {
            manager = {
                id: (this.managerId as any)._id.toString(),
                fullName: (this.managerId as any).fullName,
                email: (this.managerId as any).email,
                department: (this.managerId as any).department,
            };
        } else {
            manager = this.managerId.toString();
        }
    }

    return {
        id: this._id.toString(),
        name: this.name,
        code: this.code || '',
        managerId: manager,
        manager,
        targetPerDay: this.targetPerDay,
        status: this.status,
        description: this.description || '',
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const ProductionLine: Model<IProductionLine> = mongoose.model<IProductionLine>(
    'ProductionLine',
    productionLineSchema
);

export default ProductionLine;
