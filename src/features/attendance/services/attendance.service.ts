import AttendanceRecord, { ISession } from '../models/attendanceModel';
import User from '../../auth/models/userModel';
import { AppError } from '../../../shared/errors';
import { settingsService } from '../../settings/services/settings.service';
import { getPaginationOptions, buildPaginationMeta } from '../../user/utils/admin.utils';

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

    private async computeIsLate(now: Date): Promise<boolean> {
        try {
            const settings = await settingsService.getSettings();
            if (settings && settings.shiftStartTime) {
                const match = settings.shiftStartTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                if (match) {
                    let shiftHour = parseInt(match[1], 10);
                    const shiftMin = parseInt(match[2], 10);
                    const ampm = match[3].toUpperCase();
                    if (ampm === 'PM' && shiftHour < 12) shiftHour += 12;
                    if (ampm === 'AM' && shiftHour === 12) shiftHour = 0;
                    const thresholdMin = shiftHour * 60 + shiftMin + (settings.lateAfterMinutes ?? 15);
                    const currentMin = now.getHours() * 60 + now.getMinutes();
                    return currentMin > thresholdMin;
                }
            }
        } catch (e) {
            console.error('[AttendanceService] Error loading settings for isLate check:', e);
        }
        return now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    }

    private calculateTotalHours(sessions: ISession[]): number {
        let totalMs = 0;
        for (const session of sessions) {
            if (session.checkInTime && session.checkOutTime) {
                const start = new Date(session.checkInTime).getTime();
                const end = new Date(session.checkOutTime).getTime();
                if (end > start) totalMs += end - start;
            }
        }
        const hours = totalMs / (1000 * 60 * 60);
        return Math.round(hours * 10) / 10;
    }

    private formatSessions(sessions: ISession[] = []) {
        return sessions.map((s) => ({
            checkIn: s.checkIn || (s.checkInTime ? this.formatTimeString(new Date(s.checkInTime)) : '—'),
            checkOut: s.checkOut || (s.checkOutTime ? this.formatTimeString(new Date(s.checkOutTime)) : null),
            checkInTime: s.checkInTime,
            checkOutTime: s.checkOutTime || null,
        }));
    }

    // If userId is provided -> employee-specific; otherwise -> admin/all view
    async getTodayAttendance(userId?: string) {
        const dateStr = this.getTodayDateString();
        if (!userId) {
            const records = await AttendanceRecord.find({ date: dateStr })
                .populate('employeeId', 'fullName email department designation')
                .sort({ createdAt: -1 });

            return records.map((r: any) => {
                const formattedSessions = this.formatSessions(r.sessions || []);
                const openSession = formattedSessions.find((s) => !s.checkOutTime);
                const isCheckedIn = Boolean(openSession);
                const totalHours = this.calculateTotalHours(r.sessions || []);

                return {
                    id: r._id.toString(),
                    employeeName: (r.employeeId as any)?.fullName || 'Employee',
                    employeeEmail: (r.employeeId as any)?.email || '',
                    department: (r.employeeId as any)?.department || 'Production',
                    date: r.date,
                    checkIn: formattedSessions[0]?.checkIn || r.checkIn || null,
                    checkOut: isCheckedIn ? null : (formattedSessions.filter(s => s.checkOutTime).slice(-1)[0]?.checkOut || r.checkOut || null),
                    hours: `${totalHours.toFixed(1)}h`,
                    totalHours,
                    status: r.status,
                    sessions: formattedSessions,
                };
            });
        }

        const record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
        if (!record) {
            return {
                isCheckedIn: false,
                checkIn: null,
                checkOut: null,
                workingHours: '0.0 hrs',
                totalHours: 0,
                status: 'absent',
                sessions: [] as any[],
            };
        }

        const formattedSessions = this.formatSessions(record.sessions || []);
        const openSession = formattedSessions.find((s) => !s.checkOutTime);
        const isCheckedIn = Boolean(openSession);
        const totalHours = this.calculateTotalHours(record.sessions || []);

        return {
            isCheckedIn,
            checkIn: formattedSessions[0]?.checkIn || record.checkIn || null,
            checkOut: isCheckedIn ? null : (formattedSessions.filter(s => s.checkOutTime).slice(-1)[0]?.checkOut || record.checkOut || null),
            workingHours: `${totalHours.toFixed(1)} hrs`,
            totalHours,
            overtimeHours: record.overtimeHours || 0,
            status: record.status,
            sessions: formattedSessions,
        };
    }

    // Supports both user flow (string userId) and admin DTO flow ({ employeeId, checkInTime, status })
    async checkIn(userIdOrDto: string | any) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);
        const isLate = await this.computeIsLate(now);

        if (typeof userIdOrDto !== 'string') {
            const dto = userIdOrDto;
            const employeeId = dto.employeeId;
            const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : now;
            const time = dto.checkIn ? dto.checkIn : this.formatTimeString(checkInTime);

            let record = await AttendanceRecord.findOne({ employeeId, date: dateStr });
            if (!record) {
                record = new AttendanceRecord({
                    employeeId,
                    date: dateStr,
                    sessions: [{ checkInTime, checkOutTime: null, checkIn: time, checkOut: null }],
                    checkIn: time,
                    checkInTime,
                    checkOut: null,
                    checkOutTime: null,
                    totalHours: 0,
                    overtimeHours: 0,
                    status: dto.status || (isLate ? 'late' : 'present'),
                    shift: 'Shift A',
                    isApproved: false,
                });
            } else {
                const openSession = record.sessions.find((s) => !s.checkOutTime);
                if (openSession) throw AppError.badRequest('Employee already checked in');

                const newSession: ISession = { checkInTime, checkOutTime: null, checkIn: time, checkOut: null };
                record.sessions.push(newSession);
                record.status = dto.status || (isLate ? 'late' : 'present');
                record.checkIn = record.sessions[0]?.checkIn ?? time;
                record.checkInTime = record.sessions[0]?.checkInTime ?? checkInTime;
                record.checkOut = null;
                record.checkOutTime = null;
            }

            await record.save();
            return record;
        }

        const userId = userIdOrDto as string;
        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
        if (!record) {
            record = new AttendanceRecord({
                employeeId: userId,
                date: dateStr,
                sessions: [{ checkInTime: now, checkOutTime: null, checkIn: timeStr, checkOut: null }],
                checkIn: timeStr,
                checkInTime: now,
                checkOut: null,
                checkOutTime: null,
                totalHours: 0,
                overtimeHours: 0,
                status: isLate ? 'late' : 'present',
                shift: 'Shift A',
                isApproved: false,
            });
        } else {
            const openSession = record.sessions.find((s) => !s.checkOutTime);
            if (openSession) throw AppError.badRequest('You are already checked in');

            const newSession: ISession = { checkInTime: now, checkOutTime: null, checkIn: timeStr, checkOut: null };
            record.sessions.push(newSession);
            record.status = isLate ? 'late' : 'present';
            record.checkIn = record.sessions[0]?.checkIn ?? timeStr;
            record.checkInTime = record.sessions[0]?.checkInTime ?? now;
            record.checkOut = null;
            record.checkOutTime = null;
        }

        await record.save();
        return record;
    }

    // Supports admin DTO or userId string
    async checkOut(userIdOrDto: string | any) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);

        if (typeof userIdOrDto !== 'string') {
            const dto = userIdOrDto;
            const attendanceId = dto.attendanceId;
            const employeeId = dto.employeeId;
            const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : now;
            const time = dto.checkOut ? dto.checkOut : this.formatTimeString(checkOutTime);

            let record: any = null;
            if (attendanceId) record = await AttendanceRecord.findById(attendanceId);
            else if (employeeId) record = await AttendanceRecord.findOne({ employeeId, date: dateStr });

            if (!record) throw AppError.badRequest('Active attendance record not found for checkout');

            const openSessionIndex = record.sessions.findIndex((s: any) => !s.checkOutTime);
            if (openSessionIndex === -1) throw AppError.badRequest('Active attendance record not found for checkout');

            record.sessions[openSessionIndex].checkOutTime = checkOutTime;
            record.sessions[openSessionIndex].checkOut = time;
            record.checkOut = time;
            record.checkOutTime = checkOutTime;

            const totalHours = this.calculateTotalHours(record.sessions);
            record.totalHours = totalHours;

            let halfDayThreshold = 4;
            let minFullDayHours = 8;
            try {
                const settings = await settingsService.getSettings();
                if (settings) {
                    halfDayThreshold = settings.halfDayThresholdHours ?? 4;
                    minFullDayHours = settings.minFullDayHours ?? 8;
                }
            } catch (e) {
                console.error('[AttendanceService] Error loading settings for checkOut thresholds:', e);
            }

            if (totalHours < halfDayThreshold) record.status = 'half_day';
            else if (totalHours > minFullDayHours) record.overtimeHours = Math.round((totalHours - minFullDayHours) * 10) / 10;
            else record.overtimeHours = 0;

            await record.save();
            return record;
        }

        const userId = userIdOrDto as string;
        const record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
        if (!record) throw AppError.badRequest('You are not currently checked in');

        const openSessionIndex = record.sessions.findIndex((s) => !s.checkOutTime);
        if (openSessionIndex === -1) throw AppError.badRequest('You are not currently checked in');

        record.sessions[openSessionIndex].checkOutTime = now;
        record.sessions[openSessionIndex].checkOut = timeStr;
        record.checkOut = timeStr;
        record.checkOutTime = now;

        const totalHours = this.calculateTotalHours(record.sessions);
        record.totalHours = totalHours;

        let halfDayThreshold = 4;
        let minFullDayHours = 8;
        try {
            const settings = await settingsService.getSettings();
            if (settings) {
                halfDayThreshold = settings.halfDayThresholdHours ?? 4;
                minFullDayHours = settings.minFullDayHours ?? 8;
            }
        } catch (e) {
            console.error('[AttendanceService] Error loading settings for checkOut thresholds:', e);
        }

        if (totalHours < halfDayThreshold) record.status = 'half_day';
        else if (totalHours > minFullDayHours) record.overtimeHours = Math.round((totalHours - minFullDayHours) * 10) / 10;
        else record.overtimeHours = 0;

        await record.save();
        return record;
    }

    async getAttendanceHistory(userId: string) {
        const records = await AttendanceRecord.find({ employeeId: userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(30);

        return records.map((r: any) => {
            const totalHours = this.calculateTotalHours(r.sessions || []);
            const formattedSessions = this.formatSessions(r.sessions || []);

            return {
                id: r._id.toString(),
                date: r.date,
                checkIn: formattedSessions[0]?.checkIn || r.checkIn || null,
                checkOut: formattedSessions.filter(s => s.checkOutTime).slice(-1)[0]?.checkOut || r.checkOut || null,
                hours: `${totalHours.toFixed(1)}h`,
                totalHours,
                status: r.status,
                sessions: formattedSessions,
            };
        });
    }

    async getEmployeeDashboardSummary(userId?: string) {
        if (!userId) return { todayStatus: 'not_checked_in', checkInTime: null, checkOutTime: null, monthPresentDays: 0, monthHoursWorked: 0 };

        const todayData: any = await this.getTodayAttendance(userId);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;
        const monthRecords = await AttendanceRecord.find({ employeeId: userId, date: new RegExp(`^${prefix}`) });

        const monthPresentDays = monthRecords.filter((r: any) => (r.status || '').toLowerCase() === 'present' || (r.status || '').toLowerCase() === 'late').length;
        const monthHoursWorked = monthRecords.reduce((acc: number, r: any) => acc + this.calculateTotalHours(r.sessions || []), 0);

        return {
            todayStatus: todayData.status || (todayData.isCheckedIn ? 'present' : 'absent'),
            checkInTime: todayData.checkIn || null,
            checkOutTime: todayData.checkOut || null,
            monthPresentDays,
            monthHoursWorked,
        };
    }

    async getAllAttendance(role: string, userId: string) {
        let filter: any = {};
        if (role === 'manager') {
            const teamUsers = await User.find({ role: 'employee' }).select('_id');
            filter.employeeId = { $in: teamUsers.map((u: any) => u._id) };
        }

        const records = await AttendanceRecord.find(filter)
            .populate('employeeId', 'fullName email department designation')
            .sort({ date: -1, createdAt: -1 });

        return records.map((r: any) => {
            const totalHours = this.calculateTotalHours(r.sessions || []);
            const formattedSessions = this.formatSessions(r.sessions || []);

            return {
                id: r._id.toString(),
                employeeName: (r.employeeId as any)?.fullName || 'Employee',
                employeeEmail: (r.employeeId as any)?.email || '',
                department: (r.employeeId as any)?.department || 'Production',
                date: r.date,
                checkIn: formattedSessions[0]?.checkIn || r.checkIn || null,
                checkOut: formattedSessions.filter(s => s.checkOutTime).slice(-1)[0]?.checkOut || r.checkOut || null,
                hours: `${totalHours.toFixed(1)}h`,
                status: r.status,
                sessions: formattedSessions,
            };
        });
    }

    // Admin helpers
    async getAttendanceSummary() {
        const todayStr = this.getTodayDateString();
        const totalEmployees = await User.countDocuments({ status: 'active' });

        const stats = {
            present: await AttendanceRecord.countDocuments({ date: todayStr, status: 'present' }),
            late: await AttendanceRecord.countDocuments({ date: todayStr, status: 'late' }),
            halfDay: await AttendanceRecord.countDocuments({ date: todayStr, status: 'half_day' }),
        };

        const presentRate = totalEmployees > 0 ? Math.round(((stats.present + stats.late + stats.halfDay) / totalEmployees) * 100) : 0;

        return {
            totalEmployees,
            todayPresent: stats.present,
            todayAbsent: Math.max(0, totalEmployees - (stats.present + stats.late + stats.halfDay)),
            todayLate: stats.late,
            todayHalfDay: stats.halfDay,
            attendancePercentage: presentRate,
        };
    }

    async getEmployeeAttendance(employeeId: string, query: any) {
        const { page, limit, skip } = getPaginationOptions(query);
        const [records, total] = await Promise.all([
            AttendanceRecord.find({ employeeId }).sort({ date: -1 }).skip(skip).limit(limit),
            AttendanceRecord.countDocuments({ employeeId }),
        ]);
        const meta = buildPaginationMeta(total, page, limit);

        return { records, total, pagination: meta };
    }

    async getMonthlyAttendance(year?: number, month?: number) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || now.getMonth() + 1;
        const prefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        const records = await AttendanceRecord.find({ date: new RegExp(`^${prefix}`) });
        return { year: targetYear, month: targetMonth, totalRecords: records.length, records };
    }
}

export default AttendanceService;
