import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/userModel';
import Otp from '../models/otpModel';
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
import { asyncHandler, AppError } from '../../../shared/errors';

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 5;

const createAndSendOtp = async (email: string, purpose: OtpPurpose) => {
    await Otp.deleteMany({ email, purpose });
    const code = generateOtp();
    await Otp.create({
        email,
        code,
        purpose,
        expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    const resendResponse = await sendOtp(email, code);
    return resendResponse;
};

// @route POST /api/auth/login
export const login = asyncHandler(async (req: Request<unknown, unknown, LoginRequestBody>, res: Response, next: NextFunction) => {
    const result = loginValidator.safeParse(req.body);
    if (!result.success) {
        throw AppError.badRequest('Email and password are required.');
    }

    const { email, password } = result.data;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        throw AppError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw AppError.unauthorized('Invalid email or password.');
    }
    const emailResponse = await createAndSendOtp(user.email, 'login');

    return res.status(200).json({
        message: 'OTP sent to your email for login verification.',
        requiresOtp: true,
        email: user.email,
        emailResponse,
    });
});

// @route POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request<unknown, unknown, VerifyOtpRequestBody>, res: Response, next: NextFunction) => {
    const result = verifyOtpValidator.safeParse(req.body);
    if (!result.success) {
        throw AppError.badRequest('Email, code, and purpose are required.');
    }

    const { email, code, purpose } = result.data;

    const otpRecord = await Otp.findOne({
        email: email.toLowerCase(),
        code,
        purpose,
    });

    if (!otpRecord) {
        throw AppError.badRequest('Invalid or expired OTP.');
    }

    if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: otpRecord._id });
        throw AppError.badRequest('OTP has expired. Please request a new one.');
    }

    await Otp.deleteMany({ email: email.toLowerCase(), purpose });

    if (purpose === 'forgot-password') {
        return res.status(200).json({
            message: 'OTP verified successfully.',
            email: email.toLowerCase(),
            resetAllowed: true,
        });
    }

    const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isVerified: true },
        { new: true }
    );

    if (!user) {
        throw AppError.notFound('User not found.');
    }

    const token = generateToken(user._id.toString());

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: 'OTP verified successfully.',
        token,
        user: user.toPublicJSON(),
    });
});

// @route POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req: Request<unknown, unknown, ResendOtpRequestBody>, res: Response, next: NextFunction) => {
    const result = resendOtpValidator.safeParse(req.body);
    if (!result.success) {
        throw AppError.badRequest('Email and purpose are required.');
    }

    const { email, purpose } = result.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw AppError.notFound('User not found.');
    }

    const emailResponse = await createAndSendOtp(user.email, purpose);

    return res.status(200).json({
        message: 'A new OTP has been sent to your email.',
        email: user.email,
        emailResponse,
    });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, newpassword } = req.body;
    if (!email || !newpassword) {
        throw AppError.badRequest('Email and new password are required.');
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
        throw AppError.notFound('Email address not found.');
    }
    user.password = newpassword;
    await user.save();
    await Otp.deleteMany({ email: user.email, purpose: 'forgot-password' });

    return res.status(200).json({
        message: 'Password reset successfully.',
    });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
        throw AppError.badRequest('Email is required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw AppError.notFound('Email address not found.');
    }

    const emailResponse = await createAndSendOtp(user.email, 'forgot-password');

    return res.status(200).json({
        message: 'OTP sent to your email for password reset.',
        email: user.email,
        requiresOtp: true,
        emailResponse,
    });
});

export const verifySetupToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const tokenInput = req.params.token || (req.query.token as string);
    if (!tokenInput) {
        throw AppError.badRequest('Token is required.');
    }

    const rawToken = decodeURIComponent(tokenInput.toString().trim());
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
        setupPasswordToken: hashedToken,
        setupPasswordExpire: { $gt: new Date() },
    }).select('+setupPasswordToken +setupPasswordExpire');

    if (!user) {
        throw AppError.badRequest('Invalid or expired password setup link. Please contact your administrator.');
    }

    return res.status(200).json({
        valid: true,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    });
});

export const setupPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token: tokenInput, newPassword, confirmPassword } = req.body;
    if (!tokenInput || !newPassword) {
        throw AppError.badRequest('Token and new password are required.');
    }
    if (confirmPassword && newPassword !== confirmPassword) {
        throw AppError.badRequest('Passwords do not match.');
    }
    if (newPassword.length < 6) {
        throw AppError.badRequest('Password must be at least 6 characters.');
    }

    const rawToken = decodeURIComponent(tokenInput.toString().trim());
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
        setupPasswordToken: hashedToken,
        setupPasswordExpire: { $gt: new Date() },
    }).select('+setupPasswordToken +setupPasswordExpire');

    if (!user) {
        throw AppError.badRequest('Invalid or expired password setup link.');
    }

    user.password = newPassword;
    user.isVerified = true;
    user.setupPasswordToken = null;
    user.setupPasswordExpire = null;

    await user.save();

    return res.status(200).json({
        message: 'Password set successfully! Your account is now activated. You can sign in.',
    });
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
    });
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
    });
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
    });
});
