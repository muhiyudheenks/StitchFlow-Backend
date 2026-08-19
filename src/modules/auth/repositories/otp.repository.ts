import Otp, { IOtp } from '../models/otpModel';
import type { OtpPurpose } from '../types/authTypes';

export async function deleteByEmailAndPurpose(email: string, purpose: OtpPurpose): Promise<void> {
    await Otp.deleteMany({ email: email.toLowerCase(), purpose });
}

export async function create(email: string, code: string, purpose: OtpPurpose, expiresAt: Date): Promise<IOtp> {
    return await Otp.create({
        email: email.toLowerCase(),
        code,
        purpose,
        expiresAt,
    });
}

export async function findByEmailCodePurpose(email: string, code: string, purpose: OtpPurpose): Promise<IOtp | null> {
    return await Otp.findOne({
        email: email.toLowerCase(),
        code,
        purpose,
    });
}

export async function deleteById(id: string): Promise<void> {
    await Otp.deleteOne({ _id: id });
}

export const otpRepository = {
    deleteByEmailAndPurpose,
    create,
    findByEmailCodePurpose,
    deleteById,
};
