import jwt, { SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';

const generateToken = (userId: Types.ObjectId | string): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    };
    return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET as string, options);
};

export default generateToken;
