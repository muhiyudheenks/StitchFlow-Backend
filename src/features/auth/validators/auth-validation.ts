import { z } from "zod";

export const loginValidator = z.object({
    email: z.string().email("Invalid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
});

export const verifyOtpValidator = z.object({
    email: z.string().email(),
    code: z.string().length(6),
    purpose: z.enum(["login", "forgot-password"]),
});

export const resendOtpValidator = z.object({
    email: z.string().email("Invalid email address"),
    purpose: z.enum(["login", "forgot-password"]),
});

export const forgotPasswordValidator = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordValidator = z.object({
    email: z.string().email("Invalid email address"),
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
