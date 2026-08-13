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

        const permissionsArray = Array.isArray(req.user.permissions)
            ? req.user.permissions
            : Array.from(req.user.permissions ?? []);

        const hasPermission = permissionsArray.includes(permission as any);

        console.log('[requirePermission Debug]', {
            userId: req.user?.id,
            role: req.user?.role,
            requiredPermission: permission,
            permissionsCount: permissionsArray.length,
            permissionsArray,
            hasPermission,
        });

        // Allow admins by default
        if (req.user?.role === 'admin') {
            return next();
        }

        // Allow managers to perform production assignment actions even if DB permissions are empty
        if (req.user?.role === 'manager' && permission === PERMISSIONS.PRODUCTION_ASSIGN) {
            return next();
        }

        if (!hasPermission) {
            return res.status(403).json({
                message: "Permission denied",
            });
        }

        next();
    };
};