export type OtpPurpose = 'login' | 'forgot-password';

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
    role: "employee" | "manager" | "admin";
    companyName?: string;
    isVerified: boolean;
    isBlock: boolean;
}
