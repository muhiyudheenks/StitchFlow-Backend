import { z } from 'zod';

export const checkInSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    checkInTime: z.string().optional(),
    status: z.enum(['present', 'absent', 'late', 'half_day']).optional(),
    notes: z.string().optional(),
});

export const checkOutSchema = z.object({
    attendanceId: z.string().optional(),
    employeeId: z.string().optional(),
    checkOutTime: z.string().optional(),
    notes: z.string().optional(),
});
