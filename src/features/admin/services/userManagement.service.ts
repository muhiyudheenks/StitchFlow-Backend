import crypto from 'crypto';
import User from '../../auth/models/userModel';
import { sendInvitationEmail } from '../../../shared/services/emailService';
import { resendSetupPasswordToken } from '../../../shared/services/invitationService';
import { CreateUserDTO } from '../validators/userManagement.validators';

export class UserManagementService {
    async createUser(data: CreateUserDTO) {
        const emailNormalized = data.email.toLowerCase();

        // Determine meaningful default designation based on role/employeeType
        let defaultDesignation = 'Staff';
        if (data.role === 'manager') {
            defaultDesignation = 'Production Manager';
        } else if (data.role === 'employee') {
            const et = data.employeeType || 'stitching_worker';
            switch (et) {
                case 'stitching_worker': defaultDesignation = 'Stitching Operator'; break;
                case 'finishing_worker': defaultDesignation = 'Finishing Operator'; break;
                case 'cutting_worker': defaultDesignation = 'Cutting Operator'; break;
                case 'quality_checker': defaultDesignation = 'Quality Inspector'; break;
                case 'packing_worker': defaultDesignation = 'Packing Staff'; break;
                case 'iron_staff': defaultDesignation = 'Iron Staff'; break;
                case 'helper': defaultDesignation = 'Helper'; break;
                default: defaultDesignation = 'Production Operator';
            }
        }

        // 1. Check for duplicate email
        const existingUser = await User.findOne({ email: emailNormalized });
        if (existingUser) {
            if (!existingUser.isVerified || existingUser.setupPasswordToken) {
                if (data.fullName) existingUser.fullName = data.fullName;
                if (data.role) existingUser.role = data.role;
                if (data.role === 'employee' && data.employeeType) {
                    existingUser.employeeType = data.employeeType as any;
                } else if (data.role === 'manager') {
                    existingUser.employeeType = null;
                }
                if (data.department) existingUser.department = data.department as any;
                if (data.designation) existingUser.designation = data.designation;
                if (data.phone) existingUser.phone = data.phone;

                await resendSetupPasswordToken(existingUser);
                return existingUser.toPublicJSON();
            }
            throw new Error('DUPLICATE_EMAIL');
        }

        // 2. Generate secure random token
        // 3. Create user document
        const newUser = await User.create({
            fullName: data.fullName,
            email: emailNormalized,
            role: data.role,
            employeeType: data.role === 'employee' ? (data.employeeType || 'stitching_worker') : null,
            department: data.department || 'Production',
            designation: data.designation || defaultDesignation,
            phone: data.phone,
            isVerified: false,
        });

        // 4. Generate setup password token & dispatch invitation email
        try {
            await resendSetupPasswordToken(newUser);
        } catch (emailErr: any) {
            console.error(`[UserManagementService] Rolling back creation of ${newUser.email} due to email failure`);
            await User.deleteOne({ _id: newUser._id });
            throw new Error(`Failed to send invitation email: ${emailErr.message || emailErr}`);
        }

        return newUser.toPublicJSON();
    }

    async getManagedUsers() {
        const users = await User.find({ role: { $in: ['employee', 'manager'] } })
            .sort({ createdAt: -1 });

        return users.map((u) => u.toPublicJSON());
    }
}
