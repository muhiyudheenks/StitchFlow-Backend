import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { settingsService } from '../services/settings.service';
import { asyncHandler } from '../../../shared/errors';

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const settings = await settingsService.getSettings();
    return res.status(200).json({
        success: true,
        message: 'System settings retrieved successfully',
        data: settings,
    });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const updatedSettings = await settingsService.updateSettings(req.body);
    return res.status(200).json({
        success: true,
        message: 'System settings updated successfully',
        data: updatedSettings,
    });
});
