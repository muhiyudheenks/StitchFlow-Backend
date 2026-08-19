import User, { IUser } from '../models/userModel';

export async function findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
}

export async function findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() }).select('+password');
}

export async function findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
}

export async function findBySetupToken(hashedToken: string): Promise<IUser | null> {
    return await User.findOne({
        setupPasswordToken: hashedToken,
        setupPasswordExpire: { $gt: new Date() },
    }).select('+setupPasswordToken +setupPasswordExpire');
}

export async function save(user: IUser): Promise<IUser> {
    return await user.save();
}

export const userRepository = {
    findByEmail,
    findByEmailWithPassword,
    findById,
    findBySetupToken,
    save,
};
