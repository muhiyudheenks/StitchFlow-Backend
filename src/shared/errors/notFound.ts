import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    next(AppError.notFound(`Route not found: ${req.originalUrl}`));
};
