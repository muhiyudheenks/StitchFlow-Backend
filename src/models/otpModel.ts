import mongoose, { Document, Model, Schema } from 'mongoose';
import type { OtpPurpose } from "../types/authTypes";
export interface IOtp extends Document {
    email: string;
    code: string;
    purpose: OtpPurpose;
    expiresAt: Date;
    createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ['registration', 'login'],
            default: 'registration',
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// MongoDB TTL index — document auto-deletes once expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp: Model<IOtp> = mongoose.model<IOtp>('Otp', otpSchema);

export default Otp;