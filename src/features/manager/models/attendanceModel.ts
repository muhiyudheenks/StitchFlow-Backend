import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord extends Document {
    employeeId: mongoose.Types.ObjectId | string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'on_leave';
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendanceRecord>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: String, required: true },
        checkIn: { type: String, default: '09:00 AM' },
        checkOut: { type: String, default: '05:00 PM' },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'on_leave'],
            default: 'present',
        },
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const AttendanceRecord: Model<IAttendanceRecord> =
    mongoose.models.AttendanceRecord ||
    mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceSchema);

export default AttendanceRecord;
