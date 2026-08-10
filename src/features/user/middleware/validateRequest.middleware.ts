import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = (error as any).issues ? (error as any).issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })) : (error as any).errors ? (error as any).errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })) : [];
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    false,
                    'Validation failed',
                    null,
                    undefined,
                    formattedErrors
                );
            }
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                'Invalid request payload'
            );
        }
    };
};
