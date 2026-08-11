import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI not found in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', mongoose.connection.host);

    const db = mongoose.connection.db!;
    const usersCollection = db.collection('users');

    // Check all admins
    const admins = await usersCollection.find({ role: 'admin' }).toArray();
    console.log(`\nFound ${admins.length} admin user(s):\n`);

    for (const admin of admins) {
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role:  ${admin.role}`);
        console.log(`  Permissions (${(admin.permissions || []).length}):`, admin.permissions);
        console.log(`  Has inventory.create: ${(admin.permissions || []).includes('inventory.create')}`);
        console.log('');
    }

    // Fix all admins — use raw MongoDB driver to bypass Mongoose schema validation/hooks
    const ALL_PERMISSIONS = [
        'employees.view', 'employees.create', 'employees.update', 'employees.delete',
        'production.view', 'production.create', 'production.update', 'production.delete',
        'production.assign', 'production.verify',
        'attendance.view', 'attendance.manage', 'attendance.export',
        'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete',
        'support.view', 'support.create', 'support.update', 'support.resolve', 'support.close',
        'reports.view', 'reports.export',
        'settings.view', 'settings.manage',
    ];

    const result = await usersCollection.updateMany(
        { role: 'admin' },
        { $set: { permissions: ALL_PERMISSIONS } }
    );

    console.log(`Updated ${result.modifiedCount} admin(s).`);

    // Verify
    const updatedAdmins = await usersCollection.find({ role: 'admin' }).toArray();
    for (const admin of updatedAdmins) {
        console.log(`\nPost-fix: ${admin.email}`);
        console.log(`  Permissions (${(admin.permissions || []).length}):`, admin.permissions);
        console.log(`  Has inventory.create: ${(admin.permissions || []).includes('inventory.create')}`);
    }

    await mongoose.disconnect();
    console.log('\nDone.');
};

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
