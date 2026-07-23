import Attendance, { IAttendance } from '../models/attendanceModel';

export class AttendanceRepository {
    private getStartAndEndOfDay(date: Date = new Date()) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    async checkIn(
        employeeId: string,
        checkInTime: Date = new Date(),
        status: 'present' | 'absent' | 'late' | 'half_day' = 'present',
        notes?: string
    ): Promise<IAttendance> {
        const { start } = this.getStartAndEndOfDay(checkInTime);
        const existing = await Attendance.findOne({ employeeId, date: start });

        if (existing) {
            throw new Error('Employee has already checked in today');
        }

        const attendance = new Attendance({
            employeeId,
            date: start,
            checkInTime,
            status,
            notes,
        });
        return await attendance.save();
    }

    async checkOut(
        attendanceId?: string,
        employeeId?: string,
        checkOutTime: Date = new Date(),
        notes?: string
    ): Promise<IAttendance | null> {
        let attendance: IAttendance | null = null;

        if (attendanceId) {
            attendance = await Attendance.findById(attendanceId);
        } else if (employeeId) {
            const { start, end } = this.getStartAndEndOfDay(checkOutTime);
            attendance = await Attendance.findOne({
                employeeId,
                date: { $gte: start, $lte: end },
            });
        }

        if (!attendance) {
            return null;
        }

        attendance.checkOutTime = checkOutTime;
        if (notes) attendance.notes = notes;
        return await attendance.save();
    }

    async findTodayAttendance(): Promise<IAttendance[]> {
        const { start, end } = this.getStartAndEndOfDay();
        return await Attendance.find({
            date: { $gte: start, $lte: end },
        }).populate('employeeId', 'fullName email department designation');
    }

    async findByEmployee(
        employeeId: string,
        skip: number,
        limit: number
    ): Promise<{ records: IAttendance[]; total: number }> {
        const [records, total] = await Promise.all([
            Attendance.find({ employeeId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            Attendance.countDocuments({ employeeId }),
        ]);
        return { records, total };
    }

    async findMonthlyAttendance(year: number, month: number): Promise<IAttendance[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
        }).populate('employeeId', 'fullName email department designation');
    }

    async countTodayPresent(): Promise<number> {
        const { start, end } = this.getStartAndEndOfDay();
        return await Attendance.countDocuments({
            date: { $gte: start, $lte: end },
            status: { $in: ['present', 'late', 'half_day'] },
        });
    }

    async getTodayStats() {
        const { start, end } = this.getStartAndEndOfDay();
        const records = await Attendance.find({ date: { $gte: start, $lte: end } });
        let present = 0;
        let absent = 0;
        let late = 0;
        let halfDay = 0;

        records.forEach((r) => {
            if (r.status === 'present') present++;
            else if (r.status === 'absent') absent++;
            else if (r.status === 'late') late++;
            else if (r.status === 'half_day') halfDay++;
        });

        return { total: records.length, present, absent, late, halfDay };
    }
}
