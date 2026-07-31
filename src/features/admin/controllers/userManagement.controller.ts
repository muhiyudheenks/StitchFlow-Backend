import { Request, Response, NextFunction } from 'express';
import { UserManagementService } from '../services/userManagement.service';
import { createUserValidator } from '../validators/userManagement.validators';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';
import { asyncHandler, AppError } from '../../../shared/errors';

const userManagementService = new UserManagementService();

export const createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validation = createUserValidator.safeParse(req.body);
    if (!validation.success) {
        throw AppError.unprocessable(validation.error.issues[0]?.message || 'Validation failed');
    }

    const user = await userManagementService.createUser(validation.data);
    return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        true,
        'User created successfully. Invitation email sent.',
        user
    );
});

export const getManagedUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const users = await userManagementService.getManagedUsers();
    return sendResponse(
        res,
        HTTP_STATUS.OK,
        true,
        'Users retrieved successfully',
        users
    );
});
