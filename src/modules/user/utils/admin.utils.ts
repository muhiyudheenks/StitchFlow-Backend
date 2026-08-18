import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/admin.types';

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message: string,
    data?: T,
    pagination?: PaginationMeta,
    error?: any
): Response => {
    const payload: ApiResponse<T> = {
        success,
        message,
        ...(data !== undefined && { data }),
        ...(pagination !== undefined && { pagination }),
        ...(error !== undefined && { error }),
    };
    return res.status(statusCode).json(payload);
};

export const getPaginationOptions = (query: { page?: any; limit?: any }) => {
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export const buildPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
        page,
        limit,
        total,
        totalPages,
    };
};
