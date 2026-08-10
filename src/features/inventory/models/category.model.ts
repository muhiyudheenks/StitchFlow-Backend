import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
