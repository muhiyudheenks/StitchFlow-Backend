import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyDocument extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    fileUrl: string;
    category: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const companyDocumentSchema = new Schema<ICompanyDocument>(
    {
        title: { type: String, required: true, trim: true },
        fileUrl: { type: String, required: true, trim: true },
        category: { type: String, default: 'General' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const CompanyDocument: Model<ICompanyDocument> =
    mongoose.models.CompanyDocument || mongoose.model<ICompanyDocument>('CompanyDocument', companyDocumentSchema);

export default CompanyDocument;
