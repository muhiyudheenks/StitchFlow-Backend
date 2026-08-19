import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { getProfile as fetchProfile, updateProfile as saveProfile } from '../services/profile.service';
import { asyncHandler, AppError } from '../../../shared/errors';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await fetchProfile(req.user?.id || '');
    if (!user) {
        throw AppError.notFound('User profile not found');
    }
    return res.status(200).json({ success: true, message: 'Profile retrieved', data: user });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await saveProfile(req.user?.id || '', req.body);
    return res.status(200).json({ success: true, message: 'Profile updated', data: user });
});
