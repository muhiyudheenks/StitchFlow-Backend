import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    // 1. Plant & Enterprise Details
    factoryName: string;
    superAdminEmail: string;
    phone: string;
    address: string;

    // 2. Attendance Settings
    shiftStartTime: string;
    shiftEndTime: string;
    lateAfterMinutes: number;
    halfDayThresholdHours: number;
    minFullDayHours: number;

    // 3. Production Settings
    defaultProductionTarget: number;
    efficiencyAlertThreshold: number;

    // 4. Inventory Settings
    lowStockThreshold: number;
    criticalStockThreshold: number;

    // 5. Notification Settings
    enableInAppNotifications: boolean;
    enableEmailNotifications: boolean;
    enableProductionAlerts: boolean;
    enableInventoryAlerts: boolean;
    enableAttendanceAlerts: boolean;
    enableSupportTicketNotifications: boolean;

    // 6. Automated Report Settings
    enableDailyAttendanceSummary: boolean;
    attendanceSummaryTime: string;

    // 7. Automated Alert Triggers
    alertSupervisorLowEfficiency: boolean;
    notifyManagerLowStock: boolean;
    automatedDailyAttendancePdf: boolean;

    updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
    {
        factoryName: { type: String, default: 'StitchFlow Apparel Plant #01', required: true },
        superAdminEmail: { type: String, default: 'admin@stitchflow.com', required: true },
        phone: { type: String, default: '+91 98765 43210', required: true },
        address: { type: String, default: 'Industrial Plot #42, Garment Tech Zone, Bangalore, Karnataka - 560099', required: true },

        shiftStartTime: { type: String, default: '09:00 AM', required: true },
        shiftEndTime: { type: String, default: '05:00 PM', required: true },
        lateAfterMinutes: { type: Number, default: 15, required: true },
        halfDayThresholdHours: { type: Number, default: 4, required: true },
        minFullDayHours: { type: Number, default: 8, required: true },

        defaultProductionTarget: { type: Number, default: 1000, required: true },
        efficiencyAlertThreshold: { type: Number, default: 85, required: true },

        lowStockThreshold: { type: Number, default: 100, required: true },
        criticalStockThreshold: { type: Number, default: 25, required: true },

        enableInAppNotifications: { type: Boolean, default: true },
        enableEmailNotifications: { type: Boolean, default: true },
        enableProductionAlerts: { type: Boolean, default: true },
        enableInventoryAlerts: { type: Boolean, default: true },
        enableAttendanceAlerts: { type: Boolean, default: true },
        enableSupportTicketNotifications: { type: Boolean, default: true },

        enableDailyAttendanceSummary: { type: Boolean, default: true },
        attendanceSummaryTime: { type: String, default: '06:00 PM', required: true },

        alertSupervisorLowEfficiency: { type: Boolean, default: true },
        notifyManagerLowStock: { type: Boolean, default: true },
        automatedDailyAttendancePdf: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
export default SystemSettings;
