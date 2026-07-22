import { Request } from "express";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: "employee" | "manager" | "admin";
        email: string;
    };
}