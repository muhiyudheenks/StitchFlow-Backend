import { Response, NextFunction } from "express";
import { PERMISSIONS } from "../constants/permissions";
import { AuthRequest } from "../types/roleTypes";

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const requirePermission = (permission: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (!req.user.permissions?.includes(permission)) {
            return res.status(403).json({
                message: "Permission denied",
            });
        }

        next();
    };
};