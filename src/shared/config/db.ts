import mongoose from 'mongoose';

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

        // Run attendance multi-session migration
        try {
            const { migrateAttendanceSessions } = await import('../../database/seeds/migrateAttendanceSessions');
            await migrateAttendanceSessions();
        } catch (attMigErr) {
            console.error('Attendance migration note:', attMigErr);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`MongoDB connection failed: ${message}`);
        process.exit(1);
    }
};

export default connectDB;
