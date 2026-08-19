import User from '../../auth/models/userModel';
import AttendanceRecord from '../../attendance/models/attendanceModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import Task from '../../tasks/models/taskModel';
import * as profileService from '../../profile/services/profile.service';
import * as leaveService from '../../leave/services/leave.service';
import * as employeeDashboardService from '../../dashboard/services/employeeDashboard.service';

export async function getDashboardData(userId?: string) {
    return await employeeDashboardService.getDashboardData(userId);
}

export async function updateProfile(userId: string, data: any) {
    return await profileService.updateProfile(userId, data);
}

export async function toggleAttendance(userId: string, action: 'check_in' | 'check_out') {
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

export async function applyLeave(userId: string, data: any) {
    return await leaveService.applyLeave(userId, data);
}

export const employeeService = {
    getDashboardData,
    updateProfile,
    toggleAttendance,
    applyLeave,
};
