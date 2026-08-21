import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = err;

    // CORS Error Special Handling
    if (err.message === 'Not allowed by CORS') {
        error = AppError.forbidden('CORS policy: Access denied for this origin.');
    }
    // Zod Validation Error 
    else if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => issue.message).join(', ');
        const message = issues || 'Validation failed';
        error = AppError.unprocessable(message);
    }
    // Mongoose Duplicate Key Error
    else if (err.name === 'MongoServerError' && err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        const message = field.toLowerCase().includes('email')
            ? 'Email already exists.'
            : `Duplicate value '${value}' for ${field}. Please use another value.`;
        error = AppError.conflict(message);
    }
    // Mongoose Cast Error 
    else if (err.name === 'CastError') {
        const message = `Invalid ${err.path}: ${err.value}`;
        error = AppError.badRequest(message);
    }
    // JWT JsonWebTokenError 
    else if (err.name === 'JsonWebTokenError') {
        error = AppError.unauthorized('Invalid token. Please log in again.');
    }
    // JWT TokenExpiredError 
    else if (err.name === 'TokenExpiredError') {
        error = AppError.unauthorized('Token expired. Please log in again.');
    }
    // Generic Error not instance of AppError
    else if (!(error instanceof AppError)) {
        const statusCode = err.statusCode || err.status || 500;
        const message = err.message || 'Internal server error';
        error = new AppError(message, statusCode, false);
    }

    const statusCode = error.statusCode || 500;
    const isDev = process.env.NODE_ENV !== 'production';

    // Log errors on terminal / PM2 logs (Always log 500 errors even in production)
    if (isDev || statusCode === 500) {
        console.error('[GlobalErrorHandler]', {
            path: req.originalUrl,
            method: req.method,
            statusCode,
            message: error.message,
            stack: isDev ? error.stack : undefined,
        });
    }

    const responsePayload: any = {
        success: false,
        message: error.message,
        statusCode,
    };

    if (isDev && error.stack) {
        responsePayload.stack = error.stack;
    }

    res.status(statusCode).json(responsePayload);
};