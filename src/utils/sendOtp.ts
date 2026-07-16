/**
 * TODO: Replace with a real email/SMS provider (Nodemailer, Twilio, MSG91, etc.)
 * For now, this just logs the OTP so it can be verified during development.
 */
const sendOtp = async (email: string, code: string): Promise<boolean> => {
    console.log(`[OTP] Sending code ${code} to ${email}`);
    return true;
};

export default sendOtp;