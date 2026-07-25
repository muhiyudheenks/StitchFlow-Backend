import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { PublicUser } from '../types/authTypes';

export interface IUser extends Document {
    fullName: string;
    email: string;
    password?: string;
    role: "employee" | "manager" | "admin";
    companyName?: string;
    managerId?: mongoose.Types.ObjectId | string;
    assignedLine?: mongoose.Types.ObjectId | string | any;
    department?: string;
    designation?: string;
    phone?: string;
    status?: "active" | "inactive" | "on_leave";
    isVerified: boolean;
    isBlock: boolean;
    setupPasswordToken?: string | null;
    setupPasswordExpire?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    toPublicJSON(): PublicUser & { managerId?: string; assignedLine?: any; department?: string; designation?: string; phone?: string; status?: string; setupPasswordExpire?: Date };
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
            required: false,
            select: false,
        },
        role: {
            type: String,
            enum: ["employee", "admin", "manager"],
            default: "employee",
        },
        companyName: {
            type: String,
            trim: true,
        },
        managerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedLine: {
            type: Schema.Types.ObjectId,
            ref: 'ProductionLine',
            default: null,
        },
        department: {
            type: String,
            trim: true,
            default: 'General',
        },
        designation: {
            type: String,
            trim: true,
            default: 'Staff',
        },
        phone: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on_leave'],
            default: 'active',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isBlock: {
            type: Boolean,
            default: false,
        },
        setupPasswordToken: {
            type: String,
            default: null,
            select: false,
        },
        setupPasswordExpire: {
            type: Date,
            default: null,
        }
    },
    { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = function (
    this: IUser,
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return Promise.resolve(false);
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function (this: IUser): PublicUser & { managerId?: string; assignedLine?: any; department?: string; designation?: string; phone?: string; status?: string; setupPasswordExpire?: Date } {
    let lineObj: any = null;
    if (this.assignedLine) {
        if (typeof this.assignedLine === 'object' && this.assignedLine._id) {
            lineObj = {
                id: this.assignedLine._id.toString(),
                name: this.assignedLine.name,
                code: this.assignedLine.code || '',
            };
        } else {
            lineObj = this.assignedLine.toString();
        }
    }

    return {
        id: this._id.toString(),
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        companyName: this.companyName,
        managerId: this.managerId ? this.managerId.toString() : undefined,
        assignedLine: lineObj,
        department: this.department,
        designation: this.designation,
        phone: this.phone,
        status: this.status,
        isVerified: this.isVerified,
        isBlock: this.isBlock,
        setupPasswordExpire: this.setupPasswordExpire ?? undefined,
    };
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
