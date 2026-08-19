import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as userRepository from '../repositories/user.repository';
import * as otpRepository from '../repositories/otp.repository';
import generateOtp from '../../../shared/utils/generateOtp';
import sendOtp from '../../../shared/utils/sendOtp';
import generateToken from '../../../shared/utils/generateToken';
import type {
    LoginRequestBody,
    VerifyOtpRequestBody,
    ResendOtpRequestBody,
    OtpPurpose,
} from '../types/authTypes';
import { loginValidator, resendOtpValidator, verifyOtpValidator } from '../validators/auth-validation';
import { AppError } from '../../../shared/errors';

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 5;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function createAndSendOtp(email: string, purpose: OtpPurpose) {
    await otpRepository.deleteByEmailAndPurpose(email, purpose);
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await otpRepository.create(email, code, purpose, expiresAt);
    const resendResponse = await sendOtp(email, code);
    return resendResponse;
}

export async function login(data: LoginRequestBody) {
    const result = loginValidator.safeParse(data);
    if (!result.success) {
        throw AppError.badRequest('Email and password are required.');
    }

    const { email, password } = result.data;
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
        throw AppError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw AppError.unauthorized('Invalid email or password.');
    }

    const emailResponse = await createAndSendOtp(user.email, 'login');

    return {
        message: 'OTP sent to your email for login verification.',
        requiresOtp: true,
        email: user.email,
        emailResponse,
    };
}

export async function googleLogin(credential?: string) {
    if (!credential) {
        throw AppError.badRequest('Google credential is required.');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
        throw AppError.unauthorized('Invalid Google account.');
    }

    const user = await userRepository.findByEmail(payload.email);
    if (!user) {
        throw AppError.forbidden(
            'Your Google account is not authorized. Please contact the administrator.'
        );
    }

    if (!payload.email_verified) {
        throw AppError.unauthorized('Google email is not verified.');
    }

    const token = generateToken(user._id.toString());

    return {
        message: 'Google login successful.',
        token,
        user: user.toPublicJSON(),
    };
}

export async function verifyOtp(data: VerifyOtpRequestBody) {
    const result = verifyOtpValidator.safeParse(data);
    if (!result.success) {
        throw AppError.badRequest('Email, code, and purpose are required.');
    }

    const { email, code, purpose } = result.data;

    const otpRecord = await otpRepository.findByEmailCodePurpose(email, code, purpose);
    if (!otpRecord) {
        throw AppError.badRequest('Invalid or expired OTP.');
    }

    if (otpRecord.expiresAt < new Date()) {
        await otpRepository.deleteById(otpRecord._id.toString());
        throw AppError.badRequest('OTP has expired. Please request a new one.');
    }

    await otpRepository.deleteByEmailAndPurpose(email, purpose);

    if (purpose === 'forgot-password') {
        return {
            message: 'OTP verified successfully.',
            email: email.toLowerCase(),
            resetAllowed: true,
        };
    }

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
        throw AppError.notFound('User not found.');
    }

    if (user.password) {
        user.isVerified = true;
        await userRepository.save(user);
    }

    const token = generateToken(user._id.toString());

    return {
        message: 'OTP verified successfully.',
        token,
        user: user.toPublicJSON(),
    };
}

export async function resendOtp(data: ResendOtpRequestBody) {
    const result = resendOtpValidator.safeParse(data);
    if (!result.success) {
        throw AppError.badRequest('Email and purpose are required.');
    }

    const { email, purpose } = result.data;

    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw AppError.notFound('User not found.');
    }

    const emailResponse = await createAndSendOtp(user.email, purpose);

    return {
        message: 'A new OTP has been sent to your email.',
        email: user.email,
        emailResponse,
    };
}

export async function forgotPassword(email?: string) {
    if (!email) {
        throw AppError.badRequest('Email is required.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw AppError.notFound('Email address not found.');
    }

    const emailResponse = await createAndSendOtp(user.email, 'forgot-password');

    return {
        message: 'OTP sent to your email for password reset.',
        email: user.email,
        requiresOtp: true,
        emailResponse,
    };
}

export async function resetPassword(data: { email?: string; newpassword?: string }) {
    const { email, newpassword } = data;
    if (!email || !newpassword) {
        throw AppError.badRequest('Email and new password are required.');
    }

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
        throw AppError.notFound('Email address not found.');
    }

    user.password = newpassword;
    await userRepository.save(user);
    await otpRepository.deleteByEmailAndPurpose(user.email, 'forgot-password');

    return {
        message: 'Password reset successfully.',
    };
}

export async function verifySetupToken(tokenInput?: string) {
    if (!tokenInput) {
        throw AppError.badRequest('Token is required.');
    }

    const rawToken = decodeURIComponent(tokenInput.toString().trim());
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await userRepository.findBySetupToken(hashedToken);
    if (!user) {
        throw AppError.badRequest(
            'Invalid or expired password setup link. Please contact your administrator.'
        );
    }

    return {
        valid: true,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    };
}

export async function setupPassword(data: { token?: string; newPassword?: string; confirmPassword?: string }) {
    const { token: tokenInput, newPassword, confirmPassword } = data;
    if (!tokenInput || !newPassword) {
        throw AppError.badRequest('Token and new password are required.');
    }
    if (!confirmPassword || newPassword !== confirmPassword) {
        throw AppError.badRequest('Passwords do not match.');
    }
    if (newPassword.length < 8) {
        throw AppError.badRequest('Password must be at least 8 characters.');
    }

    const rawToken = decodeURIComponent(tokenInput.toString().trim());
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await userRepository.findBySetupToken(hashedToken);
    if (!user) {
        throw AppError.badRequest('Invalid or expired password setup link.');
    }

    user.password = newPassword;
    user.isVerified = true;
    user.setupPasswordToken = null;
    user.setupPasswordExpire = null;

    await userRepository.save(user);

    return {
        message: 'Password set successfully! Your account is now activated. You can sign in.',
    };
}

export const authService = {
    login,
    googleLogin,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    verifySetupToken,
    setupPassword,
};
