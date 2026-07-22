import { z } from "zod";

export const loginValidator = z.object({
    email: z.email("Invalid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
});

export const registerValidator = z.object({
    fullName: z.string().min(3),
    email: z.email(),
    password: z.string().min(6),
    companyName: z.string().optional(),
});

export const verifyOtpValidator = z.object({
    email: z.email(),
    code: z.string().length(6),
    purpose: z.enum(["login", "registration"]),
});

export const resendOtpValidator = z.object({
    email: z.email("Invalid email address"),
    purpose: z.enum(["registration", "login"]),
});

export const forgotPasswordValidator = z.object({
    email: z.email("Invalid email address"),
});


export const resetPasswordValidator = z.object({
    email: z.email("Invalid email address"),
    newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }
);