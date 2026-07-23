import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGO_URI as string;
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`MongoDB connection failed: ${message}`);
        process.exit(1);
    }
};

export default connectDB;
