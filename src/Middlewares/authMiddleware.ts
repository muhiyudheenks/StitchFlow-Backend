import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';

export interface AuthRequest extends Request {
    user?: IUser;
}

interface JwtPayload {
    id: string;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Not authorized. User no longer exists.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
    }
};

export default protect;