import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import Otp from '../models/otpModel';
import generateOtp from '../utils/generateOtp';
import sendOtp from '../utils/sendOtp';
import generateToken from '../utils/generateToken';
import type {
    RegisterRequestBody,
    LoginRequestBody,
    VerifyOtpRequestBody,
    ResendOtpRequestBody,
    OtpPurpose,
} from '../types/authTypes';
import { loginValidator, registerValidator, resendOtpValidator, verifyOtpValidator } from '../validations/auth-validation';
import z from 'zod';

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 5;

const createAndSendOtp = async (email: string, purpose: OtpPurpose): Promise<any> => {
    // remove any previous unused OTPs 
    await Otp.deleteMany({ email, purpose });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await Otp.create({ email, code, purpose, expiresAt });
    const smtpResponse = await sendOtp(email, code);
    return smtpResponse;
};

// @route  POST /api/auth/register
export const register = async (
    req: Request<unknown, unknown, RegisterRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const result = registerValidator.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                errors: z.flattenError(result.error).fieldErrors,
            });
        }
        const { fullName, email, password, companyName } = result.data;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const user = await User.create({ fullName, email, password, companyName });
        const smtpResponse = await createAndSendOtp(user.email, 'registration');

        return res.status(201).json({
            message: 'Account created. Please verify the OTP sent to your email.',
            email: user.email,
            smtpResponse,
        });
    } catch (err) {
        next(err)
    }
};

// /auth/login
export const login = async (
    req: Request<unknown, unknown, LoginRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const result = loginValidator.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                errors: z.flattenError(result.error).fieldErrors,
            });
        }

        const { email, password } = result.data;

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (!user.isVerified) {
            const smtpResponse = await createAndSendOtp(user.email, 'registration');
            return res.status(403).json({
                message: 'Account not verified. A new OTP has been sent.',
                requiresVerification: true,
                email: user.email,
                smtpResponse,
            });
        }

        const smtpResponse = await createAndSendOtp(user.email, 'login');

        return res.status(200).json({
            message: 'OTP sent for verification.',
            requiresOtp: true,
            email: user.email,
            smtpResponse,
        });
    } catch (err) {
        next(err)
    }
};

// verify-otp
export const verifyOtp = async (
    req: Request<unknown, unknown, VerifyOtpRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const result = verifyOtpValidator.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                errors: z.flattenError(result.error).fieldErrors,
            });
        }
        const { email, code, purpose } = result.data;

        const otpRecord = await Otp.findOne({ email: email.toLowerCase(), purpose });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Code expired or not found. Please resend a new code.' });
        }

        if (otpRecord.code !== code) {
            return res.status(400).json({ message: 'Invalid OTP code.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (purpose === 'registration' && !user.isVerified) {
            user.isVerified = true;
            await user.save();
        }

        await Otp.deleteMany({ email: user.email, purpose });

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: "Verification successful.",
            user: user.toPublicJSON(),
        });
    } catch (err) {
        next(err)
    }
};
// Resend OTP
export const resendOtp = async (
    req: Request<unknown, unknown, ResendOtpRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const result = resendOtpValidator.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: z.flattenError(result.error).fieldErrors
            })
        }
        const { email, purpose } = result.data;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const smtpResponse = await createAndSendOtp(user.email, purpose);

        return res.status(200).json({
            message: 'A new OTP has been sent.',
            smtpResponse,
        });
    } catch (err) {
        next(err)
    }
};

export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, newpassword } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({
                message: "Email not found"
            });
        }
        console.log(req.body);
        console.log(user.password);
        user.password = newpassword;
        await user.save();
        console.log("Before save:", user.password);
        return res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error(error);

        next(error)

    }
};
export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Email not found"
            });
        }

        return res.status(200).json({
            message: "Email verified"
        });

    } catch (error) {
        next(error);
    }
};