import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession {
    checkInTime: Date;
    checkOutTime?: Date | null;
    checkIn: string;
    checkOut?: string | null;
}

export interface IAttendanceRecord extends Document {
    employeeId: mongoose.Types.ObjectId | string;
    date: string;
    sessions: ISession[];
    checkIn?: string | null;
    checkOut?: string | null;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    totalHours: number;
    overtimeHours: number;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    shift: string;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
    {
        checkInTime: { type: Date, required: true },
        checkOutTime: { type: Date, default: null },
        checkIn: { type: String, required: true },
        checkOut: { type: String, default: null },
    },
    { _id: false }
);

const attendanceSchema = new Schema<IAttendanceRecord>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: String, required: true },
        sessions: { type: [sessionSchema], default: [] },
        checkIn: { type: String, default: null },
        checkOut: { type: String, default: null },
        checkInTime: { type: Date, default: null },
        checkOutTime: { type: Date, default: null },
        totalHours: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
            default: 'present',
        },
        shift: { type: String, default: 'Shift A' },
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> =
    mongoose.models.AttendanceRecord ||
    mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceSchema);

export default AttendanceRecord;
