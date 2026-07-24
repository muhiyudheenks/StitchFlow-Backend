export class NotificationsService {
    async getNotifications(userId?: string) {
        return [
            { id: 'n1', title: 'New Task Assigned', message: 'Robert Vance assigned task: Stitch Denim Jacket Collar & Cuffs', time: '1 hour ago', unread: true },
            { id: 'n2', title: 'Shift Attendance Approved', message: 'Your check-in at 08:42 AM was verified by supervisor.', time: '3 hours ago', unread: false },
            { id: 'n3', title: 'Company Announcement', message: 'Factory Safety Workshop scheduled for Friday 3:00 PM.', time: '1 day ago', unread: false },
        ];
    }
}
