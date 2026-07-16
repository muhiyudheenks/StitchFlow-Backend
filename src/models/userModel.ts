import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { PublicUser } from '../types/authTypes';

export interface IUser extends Document {
    fullName: string;
    email: string;
    password: string;
    companyName?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    toPublicJSON(): PublicUser;
}

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false,
        },
        companyName: {
            type: String,
            trim: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = function (
    this: IUser,
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function (this: IUser): PublicUser {
    return {
        id: this._id.toString(),
        fullName: this.fullName,
        email: this.email,
        companyName: this.companyName,
        isVerified: this.isVerified,
    };
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;