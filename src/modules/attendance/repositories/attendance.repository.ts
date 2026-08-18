import AttendanceRecord, { IAttendanceRecord, ISession } from '../models/attendanceModel';
import User from '../../auth/models/userModel';

export class AttendanceRepository {
    private getTodayStr(d: Date = new Date()): string {
        return d.toISOString().split('T')[0];
    }

    private getStartAndEndOfDay(date: Date = new Date()) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    private formatTimeStr(d: Date): string {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    async checkIn(
        employeeId: string,
        checkInTime: Date = new Date(),
        status: 'present' | 'absent' | 'late' | 'half_day' = 'present',
        notes?: string
    ): Promise<IAttendanceRecord> {
        const todayStr = this.getTodayStr(checkInTime);
        const existing = await AttendanceRecord.findOne({ employeeId, date: todayStr });
        const checkInFormatted = this.formatTimeStr(checkInTime);

        if (existing) {
            const openSession = (existing.sessions || []).find((session: ISession) => !session.checkOutTime);
            if (openSession) {
                throw new Error('Employee has already checked in today');
            }

            existing.sessions = [
                ...(existing.sessions || []),
                {
                    checkInTime,
                    checkOutTime: null,
                    checkIn: checkInFormatted,
                    checkOut: null,
                },
            ];
            existing.checkIn = existing.sessions[0]?.checkIn ?? checkInFormatted;
            existing.checkInTime = existing.sessions[0]?.checkInTime ?? checkInTime;
            existing.checkOut = null;
            existing.checkOutTime = null;
            existing.status = status;
            const saved = await existing.save();
            return await AttendanceRecord.findById(saved._id).populate('employeeId', 'fullName email department designation') as IAttendanceRecord;
        }

        const record = new AttendanceRecord({
            employeeId,
            date: todayStr,
            sessions: [{
                checkInTime,
                checkOutTime: null,
                checkIn: checkInFormatted,
                checkOut: null,
            }],
            checkIn: checkInFormatted,
            checkInTime,
            checkOut: null,
            checkOutTime: null,
            totalHours: 0,
            overtimeHours: 0,
            isApproved: false,
            status,
            notes,
        });
        const saved = await record.save();
        return await AttendanceRecord.findById(saved._id).populate('employeeId', 'fullName email department designation') as IAttendanceRecord;
    }

    async checkOut(
        attendanceId?: string,
        employeeId?: string,
        checkOutTime: Date = new Date(),
        notes?: string
    ): Promise<IAttendanceRecord | null> {
        let record: IAttendanceRecord | null = null;

        if (attendanceId) {
            record = await AttendanceRecord.findById(attendanceId);
        } else if (employeeId) {
            const todayStr = this.getTodayStr(checkOutTime);
            record = await AttendanceRecord.findOne({ employeeId, date: todayStr });
        }

        if (!record) {
            return null;
        }

        const checkOutFormatted = this.formatTimeStr(checkOutTime);
        const openSession = (record.sessions || []).find((session: ISession) => !session.checkOutTime);

        if (!openSession) {
            return null;
        }

        openSession.checkOutTime = checkOutTime;
        openSession.checkOut = checkOutFormatted;
        record.checkOutTime = checkOutTime;
        record.checkOut = checkOutFormatted;

        const totalHours = this.calculateTotalHours(record.sessions || []);
        record.totalHours = totalHours;
        record.overtimeHours = Math.max(0, Math.round((totalHours - 8) * 10) / 10);

        if (notes) (record as any).notes = notes;

        await record.save();
        return await AttendanceRecord.findById(record._id).populate('employeeId', 'fullName email department designation');
    }

    private calculateTotalHours(sessions: ISession[]): number {
        let totalMs = 0;
        for (const session of sessions) {
            if (session.checkInTime && session.checkOutTime) {
                const start = new Date(session.checkInTime).getTime();
                const end = new Date(session.checkOutTime).getTime();
                if (end > start) {
                    totalMs += (end - start);
                }
            }
        }
        return Math.max(0, Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10);
    }

    async findTodayAttendance(): Promise<IAttendanceRecord[]> {
        const todayStr = this.getTodayStr();
        const { start, end } = this.getStartAndEndOfDay();

        return await AttendanceRecord.find({
            $or: [
                { date: todayStr },
                { 'sessions.checkInTime': { $gte: start, $lte: end } },
                { 'sessions.checkOutTime': { $gte: start, $lte: end } },
                { createdAt: { $gte: start, $lte: end } },
            ],
        })
            .populate('employeeId', 'fullName email department designation')
            .sort({ createdAt: -1 });
    }

    async findByEmployee(
        employeeId: string,
        skip: number,
        limit: number
    ): Promise<{ records: IAttendanceRecord[]; total: number }> {
        const [records, total] = await Promise.all([
            AttendanceRecord.find({ employeeId })
                .populate('employeeId', 'fullName email department designation')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AttendanceRecord.countDocuments({ employeeId }),
        ]);
        return { records, total };
    }

    async findMonthlyAttendance(year: number, month: number): Promise<IAttendanceRecord[]> {
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const prefix = `${year}-${monthStr}`;

        return await AttendanceRecord.find({
            date: new RegExp(`^${prefix}`),
        })
            .populate('employeeId', 'fullName email department designation')
            .sort({ createdAt: -1 });
    }

    async countTodayPresent(): Promise<number> {
        const todayStr = this.getTodayStr();
        return await AttendanceRecord.countDocuments({
            date: todayStr,
            status: { $in: ['present', 'late', 'half_day'] },
        });
    }

    async getTodayStats() {
        const todayStr = this.getTodayStr();
        const { start, end } = this.getStartAndEndOfDay();

        const records = await AttendanceRecord.find({
            $or: [
                { date: todayStr },
                { 'sessions.checkInTime': { $gte: start, $lte: end } },
                { 'sessions.checkOutTime': { $gte: start, $lte: end } },
                { createdAt: { $gte: start, $lte: end } },
            ],
        });

        const total = records.length;
        let present = 0;
        let absent = 0;
        let late = 0;
        let halfDay = 0;

        for (const r of records) {
            const st = (r.status || 'present').toLowerCase();
            if (st === 'present') present++;
            else if (st === 'late') late++;
            else if (st === 'absent') absent++;
            else if (st === 'half_day' || st === 'halfday') halfDay++;
        }

        return {
            total,
            present,
            absent,
            late,
            halfDay,
        };
    }
}
