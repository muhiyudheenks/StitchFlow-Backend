import { Request, Response } from 'express';
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

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 5;

const createAndSendOtp = async (email: string, purpose: OtpPurpose): Promise<any> => {
    // remove any previous unused OTPs for this email/purpose
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
    res: Response
): Promise<Response> => {
    try {
        const { fullName, email, password, companyName } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Full name, email and password are required.' });
        }

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
        console.error("=== REGISTER ERROR LOGS ===");
        console.error(err);
        if (err instanceof Error) {
            console.error("Stack trace:\n", err.stack);
        }
        console.error("============================");

        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({
            message: 'Registration failed.',
            error: message,
            details: err instanceof Error ? {
                stack: err.stack,
                message: err.message,
                name: err.name,
                ...(err as any)
            } : err
        });
    }
};

// @route  POST /api/auth/login
export const login = async (
    req: Request<unknown, unknown, LoginRequestBody>,
    res: Response
): Promise<Response> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

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
        console.error("=== LOGIN ERROR LOGS ===");
        console.error(err);
        if (err instanceof Error) {
            console.error("Stack trace:\n", err.stack);
        }
        console.error("=========================");

        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({
            message: 'Login failed.',
            error: message,
            details: err instanceof Error ? {
                stack: err.stack,
                message: err.message,
                name: err.name,
                ...(err as any)
            } : err
        });
    }
};

// @route  POST /api/auth/verify-otp
export const verifyOtp = async (
    req: Request<unknown, unknown, VerifyOtpRequestBody>,
    res: Response
): Promise<Response> => {
    try {
        const { email, code, purpose } = req.body;

        if (!email || !code || !purpose) {
            return res.status(400).json({ message: 'Email, code and purpose are required.' });
        }

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

        return res.status(200).json({
            message: 'Verification successful.',
            token,
            user: user.toPublicJSON(),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({ message: 'OTP verification failed.', error: message });
    }
};

// @route  POST /api/auth/resend-otp
export const resendOtp = async (
    req: Request<unknown, unknown, ResendOtpRequestBody>,
    res: Response
): Promise<Response> => {
    try {
        const { email, purpose } = req.body;

        if (!email || !purpose) {
            return res.status(400).json({ message: 'Email and purpose are required.' });
        }

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
        console.error("=== RESEND OTP ERROR LOGS ===");
        console.error(err);
        if (err instanceof Error) {
            console.error("Stack trace:\n", err.stack);
        }
        console.error("==============================");

        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(500).json({
            message: 'Failed to resend OTP.',
            error: message,
            details: err instanceof Error ? {
                stack: err.stack,
                message: err.message,
                name: err.name,
                ...(err as any)
            } : err
        });
    }
};