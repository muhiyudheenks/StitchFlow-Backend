import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { NotificationsService } from '../services/notifications.service';

const notificationsService = new NotificationsService();

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await notificationsService.getNotifications(req.user?.id);
        return res.status(200).json({ success: true, message: 'Notifications retrieved', data: notifications });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
