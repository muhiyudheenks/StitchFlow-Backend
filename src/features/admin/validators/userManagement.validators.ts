import { z } from 'zod';

export const createUserValidator = z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address'),
    role: z.enum(['employee', 'manager']),
    employeeType: z.string().nullable().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
});

export type CreateUserDTO = z.infer<typeof createUserValidator>;
