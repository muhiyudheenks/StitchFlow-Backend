import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord extends Document {
    employeeId: mongoose.Types.ObjectId | string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    totalHours: number;
    overtimeHours: number;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    shift: string;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendanceRecord>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: String, required: true },
        checkIn: { type: String },
        checkOut: { type: String },
        checkInTime: { type: Date },
        checkOutTime: { type: Date },
        totalHours: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
            default: 'present',
        },
        shift: { type: String, default: 'Shift A' },
        isApproved: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index for fast lookups per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> =
    mongoose.models.AttendanceRecord ||
    mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceSchema);

export default AttendanceRecord;
