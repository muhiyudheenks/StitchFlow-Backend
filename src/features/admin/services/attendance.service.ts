import { AttendanceRepository } from '../repositories/attendance.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { CheckInDto, CheckOutDto } from '../dto/admin.dto';
import { PaginationQuery } from '../types/admin.types';
import { getPaginationOptions, buildPaginationMeta } from '../utils/admin.utils';

export class AttendanceService {
    private repo = new AttendanceRepository();
    private employeeRepo = new EmployeeRepository();
    private activityRepo = new ActivityRepository();

    async checkIn(dto: CheckInDto, adminName: string = 'Admin') {
        const employee = await this.employeeRepo.findById(dto.employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : new Date();
        const record = await this.repo.checkIn(
            dto.employeeId,
            checkInTime,
            dto.status || 'present',
            dto.notes
        );

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Recorded check-in for ${employee.fullName}`,
            'Attendance'
        );

        return record;
    }

    async checkOut(dto: CheckOutDto, adminName: string = 'Admin') {
        const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : new Date();
        const record = await this.repo.checkOut(
            dto.attendanceId,
            dto.employeeId,
            checkOutTime,
            dto.notes
        );

        if (!record) {
            throw new Error('Active attendance record not found for checkout');
        }

        await this.activityRepo.logActivity(
            adminName,
            'admin',
            `Recorded check-out for employee`,
            'Attendance'
        );

        return record;
    }

    async getTodayAttendance() {
        return await this.repo.findTodayAttendance();
    }

    async getAttendanceSummary() {
        const stats = await this.repo.getTodayStats();
        const totalEmployees = await this.employeeRepo.count({ status: 'active' });
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

    async getEmployeeAttendance(employeeId: string, query: PaginationQuery) {
        const employee = await this.employeeRepo.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        const { page, limit, skip } = getPaginationOptions(query);
        const { records, total } = await this.repo.findByEmployee(employeeId, skip, limit);
        const meta = buildPaginationMeta(total, page, limit);

        return {
            employee: employee.toPublicJSON(),
            records,
            pagination: meta,
        };
    }

    async getMonthlyAttendance(year?: number, month?: number) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || now.getMonth() + 1;

        const records = await this.repo.findMonthlyAttendance(targetYear, targetMonth);
        return {
            year: targetYear,
            month: targetMonth,
            totalRecords: records.length,
            records,
        };
    }
}
