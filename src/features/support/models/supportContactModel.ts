import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupportContact extends Document {
    hrName: string;
    hrPhone: string;
    hrEmail: string;
    hrExtension: string;
    workingHours: string;
    securityPhone: string;
    maintenancePhone: string;
    firstAidPhone: string;
    createdAt: Date;
    updatedAt: Date;
}

const supportContactSchema = new Schema<ISupportContact>(
    {
        hrName: { type: String, default: 'StitchFlow HR Helpdesk' },
        hrPhone: { type: String, default: '+91 98765 43210' },
        hrEmail: { type: String, default: 'hr@stitchflow.ai' },
        hrExtension: { type: String, default: 'Ext 402' },
        workingHours: { type: String, default: '08:00 AM - 06:00 PM (Mon - Sat)' },
        securityPhone: { type: String, default: '+91 98765 00001' },
        maintenancePhone: { type: String, default: '+91 98765 00002' },
        firstAidPhone: { type: String, default: '+91 98765 00003' },
    },
    { timestamps: true }
);

const SupportContact: Model<ISupportContact> =
    mongoose.models.SupportContact || mongoose.model<ISupportContact>('SupportContact', supportContactSchema);

export default SupportContact;
