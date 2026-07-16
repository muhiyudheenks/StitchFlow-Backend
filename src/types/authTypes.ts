export type OtpPurpose = 'registration' | 'login';

export interface RegisterRequestBody {
    fullName: string;
    email: string;
    password: string;
    companyName?: string;
}

export interface LoginRequestBody {
    email: string;
    password: string;
}

export interface VerifyOtpRequestBody {
    email: string;
    code: string;
    purpose: OtpPurpose;
}

export interface ResendOtpRequestBody {
    email: string;
    purpose: OtpPurpose;
}

export interface PublicUser {
    id: string;
    fullName: string;
    email: string;
    companyName?: string;
    isVerified: boolean;
}