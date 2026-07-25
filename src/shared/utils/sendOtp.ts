import { Resend } from "resend";

const sendOtp = async (email: string, code: string): Promise<boolean> => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM as string,
        to: email,
        subject: "Your StitchFlow OTP",
        html: `
            <h2>Your StitchFlow OTP</h2>
            <p>Your verification code is:</p>
            <h1>${code}</h1>
            <p>This OTP is valid for 3 minutes.</p>
        `,
    });

    if (error) {
        console.error("Resend error:", error);
        return false;
    }

    return true;
};

export default sendOtp;