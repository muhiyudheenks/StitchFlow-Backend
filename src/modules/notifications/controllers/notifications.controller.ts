import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { NotificationsService } from '../services/notifications.service';
import { asyncHandler, AppError } from '../../../shared/errors';

const service = new NotificationsService();

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || (req.user as any)?._id;
    if (!userId) {
        throw AppError.unauthorized('User identity not verified');
    }
    const data = await service.getNotifications(userId.toString());
    return res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data,
    });
});

export const markNotificationAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || (req.user as any)?._id;
    if (!userId) {
        throw AppError.unauthorized('User identity not verified');
    }
    const { id } = req.params;
    const data = await service.markAsRead(userId.toString(), id);
    return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data,
    });
});

export const markAllNotificationsAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || (req.user as any)?._id;
    if (!userId) {
        throw AppError.unauthorized('User identity not verified');
    }
    const data = await service.markAllAsRead(userId.toString());
    return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data,
    });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || (req.user as any)?._id;
    if (!userId) {
        throw AppError.unauthorized('User identity not verified');
    }
    const count = await service.getUnreadCount(userId.toString());
    return res.status(200).json({
        success: true,
        data: { unreadCount: count },
    });
});
