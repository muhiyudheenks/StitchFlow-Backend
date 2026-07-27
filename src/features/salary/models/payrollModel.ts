import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayroll extends Document {
    employeeId: mongoose.Types.ObjectId | string;
    month: string;
    year: number;
    baseSalary: number;
    overtime: number;
    overtimeHours: number;
    incentives: number;
    deductions: number;
    netSalary: number;
    status: 'Paid' | 'Pending' | 'Processing';
    paidDate?: Date;
    payslipUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        month: { type: String, required: true },
        year: { type: Number, required: true },
        baseSalary: { type: Number, required: true },
        overtime: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        incentives: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 },
        netSalary: { type: Number, required: true },
        status: { type: String, enum: ['Paid', 'Pending', 'Processing'], default: 'Paid' },
        paidDate: { type: Date, default: Date.now },
        payslipUrl: { type: String },
    },
    { timestamps: true }
);

const Payroll: Model<IPayroll> = mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', payrollSchema);
export default Payroll;
