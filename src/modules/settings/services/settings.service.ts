import SystemSettings, { ISystemSettings } from '../models/systemSettingsModel';

export async function getSettings(): Promise<ISystemSettings> {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = await SystemSettings.create({});
    }
    return settings;
}

export async function updateSettings(updates: Partial<ISystemSettings>): Promise<ISystemSettings> {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = new SystemSettings(updates);
    } else {
        Object.assign(settings, updates);
    }
    await settings.save();
    return settings;
}

export const settingsService = {
    getSettings,
    updateSettings,
};
