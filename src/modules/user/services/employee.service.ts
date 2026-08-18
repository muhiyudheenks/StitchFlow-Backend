import User from '../../auth/models/userModel';
import AttendanceRecord from '../../attendance/models/attendanceModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import Task from '../../tasks/models/taskModel';
import { ProfileService } from '../../profile/services/profile.service';
import { LeaveService } from '../../leave/services/leave.service';
import { EmployeeDashboardService } from '../../dashboard/services/employeeDashboard.service';

const profileService = new ProfileService();
const leaveService = new LeaveService();
const employeeDashboardService = new EmployeeDashboardService();

export class EmployeeService {
    async getDashboardData(userId?: string) {
        return await employeeDashboardService.getDashboardData(userId);
    }

    async updateProfile(userId: string, data: any) {
        return await profileService.updateProfile(userId, data);
    }

    async toggleAttendance(userId: string, action: 'check_in' | 'check_out') {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (action === 'check_in') {
            const record = await AttendanceRecord.create({
                employeeId: userId,
                date: dateStr,
                checkIn: timeStr,
                checkInTime: now,
                status: 'present',
            });
            return { action: 'check_in', time: timeStr, record };
        } else {
            const existing = await AttendanceRecord.findOne({ employeeId: userId, date: dateStr });
            let totalHours = 0;
            let overtimeHours = 0;
            if (existing && existing.checkInTime) {
                const diffMs = now.getTime() - existing.checkInTime.getTime();
                totalHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
                overtimeHours = Math.max(0, Math.round((totalHours - 8) * 10) / 10);
            }
            const record = await AttendanceRecord.findOneAndUpdate(
                { employeeId: userId, date: dateStr },
                { checkOut: timeStr, checkOutTime: now, totalHours, overtimeHours },
                { new: true }
            );
            return { action: 'check_out', time: timeStr, record };
        }
    }

    async applyLeave(userId: string, data: any) {
        return await leaveService.applyLeave(userId, data);
    }
}
