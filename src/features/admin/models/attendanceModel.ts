import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendance extends Document {
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    checkInTime: Date;
    checkOutTime?: Date;
    status: 'present' | 'absent' | 'late' | 'half_day';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee ID is required'],
        },
        date: {
            type: Date,
            required: true,
            default: () => {
                const now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },
        },
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        checkOutTime: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day'],
            default: 'present',
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
