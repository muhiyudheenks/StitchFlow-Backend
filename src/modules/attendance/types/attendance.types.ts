import { Document, Types } from 'mongoose';

export interface ISession {
    checkInTime: Date;
    checkOutTime?: Date | null;
    checkIn: string;
    checkOut?: string | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

export interface IAttendanceRecord extends Document {
    employeeId: Types.ObjectId | string;
    date: string;
    sessions: ISession[];
    checkIn?: string | null;
    checkOut?: string | null;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    totalHours: number;
    overtimeHours: number;
    status: AttendanceStatus;
    shift: string;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CheckInDTO {
    employeeId: string;
    checkInTime?: string | Date;
    checkIn?: string;
    status?: AttendanceStatus;
    notes?: string;
}

export interface CheckOutDTO {
    attendanceId?: string;
    employeeId?: string;
    checkOutTime?: string | Date;
    checkOut?: string;
    notes?: string;
}

export interface EmployeeDashboardSummary {
    todayStatus: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    monthPresentDays: number;
    monthHoursWorked: number;
}
