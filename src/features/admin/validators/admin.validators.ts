import { z } from 'zod';

export const createEmployeeSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    companyName: z.string().optional(),
    managerId: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_leave']).optional(),
});

export const updateEmployeeSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    companyName: z.string().optional(),
    managerId: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_leave']).optional(),
    isBlock: z.boolean().optional(),
});

export const createManagerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    companyName: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
});

export const updateManagerSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    companyName: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
    isBlock: z.boolean().optional(),
});

export const assignEmployeesSchema = z.object({
    employeeIds: z.array(z.string()).min(1, 'At least one employee ID is required'),
});

export const createProductionSchema = z.object({
    title: z.string().min(1, 'Production title is required'),
    targetQuantity: z.number().min(1, 'Target quantity must be greater than 0'),
    completedQuantity: z.number().min(0).optional(),
    managerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).optional(),
});

export const updateProductionSchema = z.object({
    title: z.string().min(1).optional(),
    targetQuantity: z.number().min(1).optional(),
    completedQuantity: z.number().min(0).optional(),
    managerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).optional(),
});

export const createInventorySchema = z.object({
    itemName: z.string().min(1, 'Item name is required'),
    category: z.string().optional(),
    stockQuantity: z.number().min(0, 'Stock quantity cannot be negative'),
    minStockLevel: z.number().min(0, 'Minimum stock level cannot be negative'),
    unit: z.string().optional(),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
});

export const updateInventorySchema = z.object({
    itemName: z.string().optional(),
    category: z.string().optional(),
    stockQuantity: z.number().min(0).optional(),
    minStockLevel: z.number().min(0).optional(),
    unit: z.string().optional(),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
    status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
});

export const stockAdjustSchema = z.object({
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    reason: z.string().optional(),
});

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
