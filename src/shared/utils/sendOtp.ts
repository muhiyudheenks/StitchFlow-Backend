import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOtp = async (email: string, code: string): Promise<boolean> => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your StitchFlow OTP",
        html: `
            <h2>Your StitchFlow OTP</h2>
            <p>Your verification code is:</p>
            <h1>${code}</h1>
            <p>This OTP is valid for 3 minutes.</p>
        `,
    });

    return true;
};

export default sendOtp;
