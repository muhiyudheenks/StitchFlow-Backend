import crypto from 'crypto';
import User from '../../auth/models/userModel';
import { sendInvitationEmail } from '../../../shared/services/emailService';
import { resendSetupPasswordToken } from '../../../shared/services/invitationService';
import { CreateUserDTO } from '../validators/userManagement.validators';

export class UserManagementService {
    async createUser(data: CreateUserDTO) {
        const emailNormalized = data.email.toLowerCase();

        // 1. Check for duplicate email
        const existingUser = await User.findOne({ email: emailNormalized });
        if (existingUser) {
            if (!existingUser.isVerified || existingUser.setupPasswordToken) {
                if (data.fullName) existingUser.fullName = data.fullName;
                if (data.role) existingUser.role = data.role;
                if (data.department) existingUser.department = data.department;
                if (data.designation) existingUser.designation = data.designation;
                if (data.phone) existingUser.phone = data.phone;

                await resendSetupPasswordToken(existingUser);
                return existingUser.toPublicJSON();
            }
            throw new Error('DUPLICATE_EMAIL');
        }

        // 2. Generate secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const setupPasswordExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 3. Create user document
        const newUser = await User.create({
            fullName: data.fullName,
            email: emailNormalized,
            role: data.role,
            department: data.department || 'General',
            designation: data.designation || (data.role === 'manager' ? 'Line Manager' : 'Staff'),
            phone: data.phone,
            isVerified: false,
            setupPasswordToken: hashedToken,
            setupPasswordExpire,
        });

        // 4. Dispatch invitation email
        const clientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
        const setupUrl = `${clientUrl}/set-password/${rawToken}`;

        try {
            await sendInvitationEmail(newUser.email, newUser.fullName, newUser.role, setupUrl);
        } catch (emailErr) {
            console.error('Failed to send invitation email:', emailErr);
            // Return user even if email dispatch fails so admin knows account was created
        }

        return newUser.toPublicJSON();
    }

    async getManagedUsers() {
        const users = await User.find({ role: { $in: ['employee', 'manager'] } })
            .sort({ createdAt: -1 });

        return users.map((u) => u.toPublicJSON());
    }
}
