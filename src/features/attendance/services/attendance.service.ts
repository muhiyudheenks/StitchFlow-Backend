import AttendanceRecord, { ISession } from '../models/attendanceModel';
import User from '../../auth/models/userModel';
import { AppError } from '../../../shared/errors';
import { settingsService } from '../../settings/services/settings.service';

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
        // Fallback: 09:15 AM
        return now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
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
        const hours = totalMs / (1000 * 60 * 60);
        return Math.round(hours * 10) / 10;
    }

    private formatSessions(sessions: ISession[] = []): Array<{ checkIn: string; checkOut: string | null; checkInTime: Date; checkOutTime: Date | null }> {
        return sessions.map((s) => ({
            checkIn: s.checkIn || (s.checkInTime ? this.formatTimeString(new Date(s.checkInTime)) : '—'),
            checkOut: s.checkOut || (s.checkOutTime ? this.formatTimeString(new Date(s.checkOutTime)) : null),
            checkInTime: s.checkInTime,
            checkOutTime: s.checkOutTime || null,
        }));
    }

    async getTodayAttendance(userId: string) {
        const dateStr = this.getTodayDateString();
        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });

        if (!record) {
            return {
                isCheckedIn: false,
                checkIn: null,
                checkOut: null,
                workingHours: '0.0 hrs',
                totalHours: 0,
                status: 'absent',
                attendancePercentage: 96.5,
                sessions: [],
            };
        }

        const formattedSessions = this.formatSessions(record.sessions || []);
        const openSession = formattedSessions.find((s) => !s.checkOutTime);
        const isCheckedIn = Boolean(openSession);

        const firstSession = formattedSessions.length > 0 ? formattedSessions[0] : null;
        const closedSessions = formattedSessions.filter((s) => Boolean(s.checkOutTime));
        const latestClosedSession = closedSessions.length > 0 ? closedSessions[closedSessions.length - 1] : null;

        const totalHours = this.calculateTotalHours(record.sessions || []);

        return {
            isCheckedIn,
            checkIn: firstSession ? firstSession.checkIn : (record.checkIn || null),
            checkOut: isCheckedIn ? null : (latestClosedSession ? latestClosedSession.checkOut : (record.checkOut || null)),
            workingHours: `${totalHours.toFixed(1)} hrs`,
            totalHours,
            overtimeHours: record.overtimeHours || 0,
            status: record.status,
            attendancePercentage: 96.5,
            sessions: formattedSessions,
        };
    }

    async checkIn(userId: string) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);
        const isLate = await this.computeIsLate(now);

        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });

        if (!record) {
            record = new AttendanceRecord({
                employeeId: userId,
                date: dateStr,
                sessions: [
                    {
                        checkInTime: now,
                        checkOutTime: null,
                        checkIn: timeStr,
                        checkOut: null,
                    },
                ],
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
            if (openSession) {
                throw AppError.badRequest('You are already checked in');
            }

            const newSession: ISession = {
                checkInTime: now,
                checkOutTime: null,
                checkIn: timeStr,
                checkOut: null,
            };

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

    async checkOut(userId: string) {
        const dateStr = this.getTodayDateString();
        const now = new Date();
        const timeStr = this.formatTimeString(now);

        let record = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });

        if (!record) {
            throw AppError.badRequest('You are not currently checked in');
        }

        const openSessionIndex = record.sessions.findIndex((s) => !s.checkOutTime);
        if (openSessionIndex === -1) {
            throw AppError.badRequest('You are not currently checked in');
        }

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

        if (totalHours < halfDayThreshold) {
            record.status = 'half_day';
        } else if (totalHours > minFullDayHours) {
            record.overtimeHours = Math.round((totalHours - minFullDayHours) * 10) / 10;
        } else {
            record.overtimeHours = 0;
        }

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
            const firstSession = formattedSessions.length > 0 ? formattedSessions[0] : null;
            const closedSessions = formattedSessions.filter((s) => Boolean(s.checkOutTime));
            const latestClosed = closedSessions.length > 0 ? closedSessions[closedSessions.length - 1] : null;

            return {
                id: r._id.toString(),
                date: r.date,
                checkIn: firstSession ? firstSession.checkIn : (r.checkIn || null),
                checkOut: latestClosed ? latestClosed.checkOut : (r.checkOut || null),
                hours: `${totalHours.toFixed(1)}h`,
                totalHours,
                status: r.status,
                sessions: formattedSessions,
            };
        });
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
            const firstSession = formattedSessions.length > 0 ? formattedSessions[0] : null;
            const closedSessions = formattedSessions.filter((s) => Boolean(s.checkOutTime));
            const latestClosed = closedSessions.length > 0 ? closedSessions[closedSessions.length - 1] : null;

            return {
                id: r._id.toString(),
                employeeName: (r.employeeId as any)?.fullName || 'Employee',
                employeeEmail: (r.employeeId as any)?.email || '',
                department: (r.employeeId as any)?.department || 'Production',
                date: r.date,
                checkIn: firstSession ? firstSession.checkIn : (r.checkIn || null),
                checkOut: latestClosed ? latestClosed.checkOut : (r.checkOut || null),
                hours: `${totalHours.toFixed(1)}h`,
                status: r.status,
                sessions: formattedSessions,
            };
        });
    }
}
