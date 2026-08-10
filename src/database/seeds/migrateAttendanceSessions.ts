import mongoose from 'mongoose';
import AttendanceRecord from '../../features/attendance/models/attendanceModel';

export async function migrateAttendanceSessions() {
    try {
        const records = await AttendanceRecord.find({
            $or: [
                { sessions: { $exists: false } },
                { sessions: { $size: 0 } },
            ],
            checkInTime: { $ne: null },
        });

        let count = 0;
        for (const record of records) {
            if (record.checkInTime) {
                record.sessions = [
                    {
                        checkInTime: record.checkInTime,
                        checkOutTime: record.checkOutTime || null,
                        checkIn: record.checkIn || record.checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        checkOut: record.checkOut || (record.checkOutTime ? record.checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null),
                    },
                ];
                await record.save();
                count++;
            }
        }
        console.log(`[Migration] Successfully migrated ${count} legacy attendance records to multi-session format.`);
    } catch (err) {
        console.error('[Migration] Error migrating attendance sessions:', err);
    }
}
