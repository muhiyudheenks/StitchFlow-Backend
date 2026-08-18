import SystemSettings, { ISystemSettings } from '../models/systemSettingsModel';

export class SettingsService {
    // Get singleton SystemSettings document, or create default if first time
    async getSettings(): Promise<ISystemSettings> {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        return settings;
    }

    // Update singleton SystemSettings document
    async updateSettings(updates: Partial<ISystemSettings>): Promise<ISystemSettings> {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings(updates);
        } else {
            Object.assign(settings, updates);
        }
        await settings.save();
        return settings;
    }
}

export const settingsService = new SettingsService();
