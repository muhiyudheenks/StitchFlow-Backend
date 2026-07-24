import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { ProfileService } from '../services/profile.service';

const profileService = new ProfileService();

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await profileService.getProfile(req.user?.id || '');
        return res.status(200).json({ success: true, message: 'Profile retrieved', data: user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await profileService.updateProfile(req.user?.id || '', req.body);
        return res.status(200).json({ success: true, message: 'Profile updated', data: user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};
