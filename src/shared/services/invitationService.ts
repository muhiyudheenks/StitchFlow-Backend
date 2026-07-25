import crypto from 'crypto';
import { IUser } from '../../features/auth/models/userModel';
import { sendInvitationEmail } from './emailService';

export const resendSetupPasswordToken = async (user: IUser): Promise<{ user: IUser; rawToken: string }> => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const setupPasswordExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.setupPasswordToken = hashedToken;
    user.setupPasswordExpire = setupPasswordExpire;
    await user.save();

    const clientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const setupUrl = `${clientUrl}/set-password/${rawToken}`;

    try {
        await sendInvitationEmail(user.email, user.fullName, user.role, setupUrl);
    } catch (emailErr) {
        console.error('Failed to send invitation email:', emailErr);
    }

    return { user, rawToken };
};
