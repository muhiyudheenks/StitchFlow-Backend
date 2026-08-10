import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { PublicUser } from '../types/authTypes';
import {
    ADMIN_DESIGNATION,
    ADMIN_DEPARTMENT,
    MANAGER_DESIGNATIONS,
    MANAGER_DESIGNATION_TO_DEPARTMENT,
    EMPLOYEE_TYPE_TO_DESIGNATION,
    EMPLOYEE_TYPE_TO_DEPARTMENT,
} from '../../../shared/constants/userSchema.constants';
import { Permission, PERMISSIONS } from '../../../shared/constants/permissions';

export type EmployeeType =
    | 'stitching_worker'
    | 'finishing_worker'
    | 'cutting_worker'
    | 'ironing_worker'
    | 'packing_worker'
    | 'qc_inspector'
    | 'helper'
    | 'store_keeper'
    | 'machine_operator'
    | 'quality_checker'
    | 'iron_staff'
    | null;

export type DepartmentType =
    | 'Production'
    | 'Quality Control'
    | 'Finishing'
    | 'Inventory'
    | 'Packing'
    | 'Maintenance'
    | 'Quality'
    | 'HR'
    | 'Accounts'
    | 'Administration';

export interface IUser extends Document {
    fullName: string;
    email: string;
    password?: string;
    role: "employee" | "manager" | "admin";
    permissions: Permission[];
    employeeType?: EmployeeType;
    companyName?: string;
    managerId?: mongoose.Types.ObjectId | string;
    department?: DepartmentType;
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
    toPublicJSON(): PublicUser & { managerId?: string; employeeType?: EmployeeType; department?: string; designation?: string; phone?: string; status?: string; setupPasswordExpire?: Date };
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
        permissions: {
            type: [String],
            enum: Object.values(PERMISSIONS),
            default: [],
        },
        employeeType: {
            type: String,
            enum: [
                'stitching_worker',
                'finishing_worker',
                'cutting_worker',
                'ironing_worker',
                'packing_worker',
                'qc_inspector',
                'helper',
                'store_keeper',
                'machine_operator',
                'quality_checker',
                'iron_staff',
                null
            ],
            default: null,
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
        department: {
            type: String,
            enum: [
                'Production',
                'Quality Control',
                'Finishing',
                'Inventory',
                'Packing',
                'Maintenance',
                'Quality',
                'HR',
                'Accounts',
                'Administration'
            ],
            default: 'Production',
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
    // Handle password hashing if modified
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Role-based designation & department standardization
    if (this.role === 'admin') {
        this.employeeType = null;
        this.designation = ADMIN_DESIGNATION;
        this.department = ADMIN_DEPARTMENT as any;
    } else if (this.role === 'manager') {
        this.employeeType = null;
        if (!this.designation || !MANAGER_DESIGNATIONS.includes(this.designation as any)) {
            this.designation = 'Production Manager';
        }
        this.department = (MANAGER_DESIGNATION_TO_DEPARTMENT[this.designation] || 'Production') as any;
    } else if (this.role === 'employee') {
        if (!this.employeeType) {
            this.employeeType = 'stitching_worker';
        }
        this.designation = EMPLOYEE_TYPE_TO_DESIGNATION[this.employeeType] || 'Stitching Worker';
        this.department = (EMPLOYEE_TYPE_TO_DEPARTMENT[this.employeeType] || 'Production') as any;
    }

    next();
});

userSchema.methods.comparePassword = function (
    this: IUser,
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return Promise.resolve(false);
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function (this: IUser): PublicUser & { managerId?: string; employeeType?: EmployeeType; department?: string; designation?: string; phone?: string; status?: string; setupPasswordExpire?: Date } {
    let finalDesignation = this.designation;
    let finalDepartment = this.department;

    if (this.role === 'admin') {
        finalDesignation = ADMIN_DESIGNATION;
        finalDepartment = ADMIN_DEPARTMENT as any;
    } else if (this.role === 'manager') {
        if (!finalDesignation || !MANAGER_DESIGNATIONS.includes(finalDesignation as any)) {
            finalDesignation = 'Production Manager';
        }
        finalDepartment = (MANAGER_DESIGNATION_TO_DEPARTMENT[finalDesignation] || 'Production') as any;
    } else if (this.role === 'employee') {
        const et = this.employeeType || 'stitching_worker';
        finalDesignation = EMPLOYEE_TYPE_TO_DESIGNATION[et] || 'Stitching Worker';
        finalDepartment = (EMPLOYEE_TYPE_TO_DEPARTMENT[et] || 'Production') as any;
    }

    return {
        id: this._id.toString(),
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        employeeType: this.employeeType ?? null,
        companyName: this.companyName,
        managerId: this.managerId ? this.managerId.toString() : undefined,
        department: finalDepartment,
        designation: finalDesignation,
        phone: this.phone,
        status: this.status,
        isVerified: this.isVerified,
        isBlock: this.isBlock,
        setupPasswordExpire: this.setupPasswordExpire ?? undefined,
    };
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
