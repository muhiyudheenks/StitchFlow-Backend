import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import type {
    LoginRequestBody,
    VerifyOtpRequestBody,
    ResendOtpRequestBody,
} from '../types/authTypes';
import { asyncHandler } from '../../../shared/errors';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// @route POST /api/auth/login
export const login = asyncHandler(async (req: Request<unknown, unknown, LoginRequestBody>, res: Response) => {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
});

// @route POST /api/auth/google-login
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    const result = await authService.googleLogin(credential);

    res.cookie('token', result.token, COOKIE_OPTIONS);
    res.cookie('jwt', result.token, COOKIE_OPTIONS);

    return res.status(200).json(result);
});

// @route POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request<unknown, unknown, VerifyOtpRequestBody>, res: Response) => {
    const result = await authService.verifyOtp(req.body);

    if ('token' in result && result.token) {
        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.cookie('jwt', result.token, COOKIE_OPTIONS);
    }

    return res.status(200).json(result);
});

// @route POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req: Request<unknown, unknown, ResendOtpRequestBody>, res: Response) => {
    const result = await authService.resendOtp(req.body);
    return res.status(200).json(result);
});

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    return res.status(200).json(result);
});

// @route POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json(result);
});

// @route GET /api/auth/verify-setup-token/:token
export const verifySetupToken = asyncHandler(async (req: Request, res: Response) => {
    const tokenInput = req.params.token || (req.query.token as string);
    const result = await authService.verifySetupToken(tokenInput);
    return res.status(200).json(result);
});

// @route POST /api/auth/setup-password
export const setupPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.setupPassword(req.body);
    return res.status(200).json(result);
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0), sameSite: 'lax' });
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0), sameSite: 'lax' });
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
    });
});
