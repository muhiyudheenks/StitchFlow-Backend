import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

interface AppError extends Error {
    status?: number;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error.',
    });
};