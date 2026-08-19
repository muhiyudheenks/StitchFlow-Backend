import Activity, { IActivity } from '../models/activity.model';

export async function logActivity(
    userName: string,
    userRole: string,
    action: string,
    module: 'Employee' | 'Manager' | 'Production' | 'Inventory' | 'Attendance' | 'System',
    details?: string,
    userId?: string
): Promise<IActivity> {
    const activity = new Activity({
        userId: userId || null,
        userName,
        userRole,
        action,
        module,
        details,
        timestamp: new Date(),
    });
    return await activity.save();
}

export async function getRecentActivities(limit: number = 20): Promise<IActivity[]> {
    return await Activity.find()
        .sort({ timestamp: -1 })
        .limit(limit);
}

export const activityRepository = {
    logActivity,
    getRecentActivities,
};
