import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    const db = mongoose.connection.db!;
    const admin = await db.collection('users').findOne({ email: 'muhiyudheen.ks007@gmail.com' });
    console.log('Admin role:', admin?.role);
    console.log('Admin isBlock:', admin?.isBlock);
    console.log('Admin isVerified:', admin?.isVerified);
    console.log('Admin status:', admin?.status);
    await mongoose.disconnect();
};
run().catch(console.error);
