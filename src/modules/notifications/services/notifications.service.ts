import Notification, { INotification, NotificationType } from '../models/notificationModel';

export interface CreateNotificationDTO {
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    type: NotificationType;
    batchId?: string;
    taskId?: string;
    batchName?: string;
    taskName?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export async function createNotification(data: CreateNotificationDTO): Promise<INotification> {
    return await Notification.create({
        recipient: data.recipient,
        sender: data.sender || 'System',
        title: data.title,
        message: data.message,
        type: data.type,
        batchId: data.batchId,
        taskId: data.taskId,
        batchName: data.batchName,
        taskName: data.taskName,
        priority: data.priority || 'Medium',
        isRead: false,
        read: false,
    });
}

export async function getNotifications(userId: string) {
    const notifications = await Notification.find({ recipient: userId })
        .sort({ isRead: 1, createdAt: -1 })
        .lean();

    return notifications.map((n: any) => ({
        id: n._id.toString(),
        _id: n._id.toString(),
        recipient: n.recipient?.toString(),
        sender: n.sender?.toString() || 'System',
        title: n.title,
        message: n.message,
        type: n.type,
        batchId: n.batchId?.toString(),
        taskId: n.taskId?.toString(),
        batchName: n.batchName,
        taskName: n.taskName,
        priority: n.priority || 'Medium',
        isRead: Boolean(n.isRead || n.read),
        read: Boolean(n.isRead || n.read),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
    }));
}

export async function markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, read: true },
        { new: true }
    );
    return notification;
}

export async function markAllAsRead(userId: string) {
    await Notification.updateMany(
        { recipient: userId, $or: [{ isRead: false }, { read: false }] },
        { isRead: true, read: true }
    );
    return { success: true, message: 'All notifications marked as read' };
}

export async function getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
        recipient: userId,
        isRead: false,
    });
}

export const notificationsService = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
};
