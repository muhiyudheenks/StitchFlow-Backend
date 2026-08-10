import { Request } from "express";
import { Permission } from "../constants/permissions";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: "employee" | "manager" | "admin";
        email: string;
        permissions: Permission[];
    };
}
