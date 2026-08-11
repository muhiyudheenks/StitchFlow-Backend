import mongoose from 'mongoose';
import AttendanceRecord from '../../features/attendance/models/attendanceModel';

const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGO_URI as string;
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);

        // Run safe one-time database migration for employeeType
        try {
            const User = mongoose.model('User');
            await User.updateMany(
                { role: { $in: ['manager', 'admin'] } },
                { $set: { employeeType: null } }
            );
            await User.updateMany(
                { role: 'employee', $or: [{ employeeType: { $exists: false } }, { employeeType: null }] },
                { $set: { employeeType: 'stitching_worker' } }
            );

            // Grant all permissions to all admin users dynamically
            const { PERMISSIONS } = await import('../../shared/constants/permissions');
            await User.updateMany(
                { role: 'admin' },
                { $set: { permissions: Object.values(PERMISSIONS) } }
            );
        } catch (migErr) {
            console.error('Safe employeeType/permissions DB migration note:', migErr);
        }

        // Start fresh with the sessions-based attendance flow in development mode
        if (process.env.NODE_ENV !== 'production') {
            try {
                const deleted = await AttendanceRecord.deleteMany({});
                if (deleted.deletedCount > 0) {
                    console.log(`[Attendance] Cleared ${deleted.deletedCount} legacy attendance records for development.`);
                }
            } catch (attResetErr) {
                console.error('Attendance reset note:', attResetErr);
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`MongoDB connection failed: ${message}`);
        process.exit(1);
    }
};

export default connectDB;
