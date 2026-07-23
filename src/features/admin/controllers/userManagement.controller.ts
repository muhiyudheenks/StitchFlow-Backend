import { Request, Response } from 'express';
import { UserManagementService } from '../services/userManagement.service';
import { createUserValidator } from '../validators/userManagement.validators';
import { sendResponse } from '../utils/admin.utils';
import { HTTP_STATUS } from '../constants/admin.constants';

const userManagementService = new UserManagementService();

export const createUser = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const validation = createUserValidator.safeParse(req.body);
        if (!validation.success) {
            return sendResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                false,
                validation.error.issues[0]?.message || 'Validation failed'
            );
        }

        const user = await userManagementService.createUser(validation.data);
        return sendResponse(
            res,
            HTTP_STATUS.CREATED,
            true,
            'User created successfully. Invitation email sent.',
            user
        );
    } catch (error: any) {
        if (error.message === 'DUPLICATE_EMAIL') {
            return sendResponse(
                res,
                HTTP_STATUS.CONFLICT,
                false,
                'An account with this email address already exists.'
            );
        }
        return sendResponse(
            res,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            false,
            error.message || 'Failed to create user'
        );
    }
};

export const getManagedUsers = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const users = await userManagementService.getManagedUsers();
        return sendResponse(
            res,
            HTTP_STATUS.OK,
            true,
            'Users retrieved successfully',
            users
        );
    } catch (error: any) {
        return sendResponse(
            res,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            false,
            error.message || 'Failed to fetch users'
        );
    }
};
