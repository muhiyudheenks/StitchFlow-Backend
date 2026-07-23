import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendInvitationEmail = async (
    email: string,
    fullName: string,
    role: string,
    setupUrl: string
): Promise<boolean> => {
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"StitchFlow AI" <no-reply@stitchflow.ai>',
        to: email,
        subject: `You've been invited to StitchFlow AI as a ${roleCapitalized}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StitchFlow AI</h1>
                    <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Workforce & Manufacturing Intelligence</p>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${fullName}!</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                        Your StitchFlow account has been created with the role of <strong>${roleCapitalized}</strong>.
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                        Please click the button below to set up your password and activate your account.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${setupUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Set Password & Activate
                        </a>
                    </div>
                    <p style="font-size: 13px; color: #64748b; margin-top: 25px;">
                        Or copy and paste this URL into your web browser:<br/>
                        <a href="${setupUrl}" style="color: #7c3aed; word-break: break-all;">${setupUrl}</a>
                    </p>
                    <p style="font-size: 13px; color: #94a3b8; margin-top: 20px; border-t: 1px solid #f1f5f9; padding-top: 15px;">
                        This password setup link is valid for 24 hours. If you did not expect this invitation, please ignore this email.
                    </p>
                </div>
            </div>
        `,
    });

    return true;
};
