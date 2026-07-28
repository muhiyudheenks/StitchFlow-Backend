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
        } catch (migErr) {
            console.error('Safe employeeType DB migration note:', migErr);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`MongoDB connection failed: ${message}`);
        process.exit(1);
    }
};

export default connectDB;
