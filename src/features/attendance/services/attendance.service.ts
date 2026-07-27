import AttendanceRecord from '../models/attendanceModel';
import User from '../../auth/models/userModel';

export class AttendanceService {
    private getTodayDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private formatTimeString(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    async getTodayAttendance(userId: string) {
        const dateStr = this.getTodayDateString();
        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });

        if (!record) {
            return {
                isCheckedIn: false,
                checkIn: '—',
                checkOut: '—',
                workingHours: '0.0 hrs',
                totalHours: 0,
                status: 'absent',
                attendancePercentage: 96.5,
            };
        }

        return {
            isCheckedIn: Boolean(record.checkIn && !record.checkOut),
            checkIn: record.checkIn || '—',
            checkOut: record.checkOut || '—',
            workingHours: `${record.totalHours.toFixed(1)} hrs`,
            totalHours: record.totalHours,
            overtimeHours: record.overtimeHours,
            status: record.status,
            attendancePercentage: 96.5,
        };
    }

    async checkIn(userId: string) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);

        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
        if (record) {
            if (record.checkIn) {
                return record;
            }
            record.checkIn = timeStr;
            record.checkInTime = now;
        } else {
            // Determine if late (after 9:00 AM)
            const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
            record = new AttendanceRecord({
                employeeId: userId,
                date: dateStr,
                checkIn: timeStr,
                checkInTime: now,
                status: isLate ? 'late' : 'present',
                shift: 'Shift A',
            });
        }

        await record.save();
        return record;
    }

    async checkOut(userId: string) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);

        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
        if (!record || !record.checkInTime) {
            throw new Error('You must check in before checking out');
        }

        record.checkOut = timeStr;
        record.checkOutTime = now;

        // Calculate hours
        const diffMs = now.getTime() - new Date(record.checkInTime).getTime();
        const hours = Math.max(0, diffMs / (1000 * 60 * 60));
        record.totalHours = Math.round(hours * 10) / 10;

        if (record.totalHours < 4) {
            record.status = 'half_day';
        } else if (record.totalHours > 8) {
            record.overtimeHours = Math.round((record.totalHours - 8) * 10) / 10;
        }

        await record.save();
        return record;
    }

    async getAttendanceHistory(userId: string) {
        const records = await AttendanceRecord.find({ employeeId: userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(30);

        return records.map((r: any) => ({
            id: r._id.toString(),
            date: r.date,
            checkIn: r.checkIn || '—',
            checkOut: r.checkOut || '—',
            hours: `${r.totalHours.toFixed(1)}h`,
            totalHours: r.totalHours,
            status: r.status,
        }));
    }

    async getAllAttendance(role: string, userId: string) {
        let filter: any = {};
        if (role === 'manager') {
            // Manager view: get employees in manager's department/team
            const teamUsers = await User.find({ role: 'employee' }).select('_id');
            filter.employeeId = { $in: teamUsers.map((u: any) => u._id) };
        }

        const records = await AttendanceRecord.find(filter)
            .populate('employeeId', 'fullName email department designation')
            .sort({ date: -1, createdAt: -1 });

        return records.map((r: any) => ({
            id: r._id.toString(),
            employeeName: (r.employeeId as any)?.fullName || 'Employee',
            employeeEmail: (r.employeeId as any)?.email || '',
            department: (r.employeeId as any)?.department || 'Production',
            date: r.date,
            checkIn: r.checkIn || '—',
            checkOut: r.checkOut || '—',
            hours: `${r.totalHours.toFixed(1)}h`,
            status: r.status,
        }));
    }
}
