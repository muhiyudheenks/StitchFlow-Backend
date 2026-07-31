import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFAQ extends Document {
    _id: mongoose.Types.ObjectId;
    question: string;
    answer: string;
    active: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        active: { type: Boolean, default: true },
        displayOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', faqSchema);
export default FAQ;
