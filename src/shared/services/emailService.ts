import { Resend } from "resend";
import nodemailer from "nodemailer";

export const sendInvitationEmail = async (
    email: string,
    fullName: string,
    role: string,
    setupUrl: string
): Promise<boolean> => {
    console.log(`[EmailService] Attempting to send invitation email to: ${email}`);
    console.log(`[EmailService] Setup URL: ${setupUrl}`);

    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    const subject = `You've been invited to StitchFlow AI as a ${roleCapitalized}`;
    const fromAddress = process.env.EMAIL_FROM || '"StitchFlow AI" <no-reply@stitchflow.ai>';

    const htmlContent = `
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
    `;

    // 1. Try Nodemailer SMTP if SMTP credentials are fully configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    if (smtpHost && smtpUser && smtpPass) {
        try {
            console.log(`[EmailService] Using Nodemailer SMTP (${smtpHost}:${smtpPort})`);
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            await transporter.verify();
            await transporter.sendMail({
                from: fromAddress,
                to: email,
                subject,
                html: htmlContent,
            });

            console.log(`[EmailService] Invitation email sent successfully via SMTP to: ${email}`);
            return true;
        } catch (smtpErr: any) {
            console.error('[EmailService] SMTP error:', smtpErr);
            throw new Error(`SMTP email delivery failed: ${smtpErr.message || smtpErr}`);
        }
    }

    // 2. Try Resend if API key is present
    if (process.env.RESEND_API_KEY) {
        try {
            console.log('[EmailService] Using Resend API');
            const resend = new Resend(process.env.RESEND_API_KEY);
            const { error } = await resend.emails.send({
                from: fromAddress,
                to: email,
                subject,
                html: htmlContent,
            });

            if (error) {
                console.error('[EmailService] Resend error:', error);
                throw new Error(`Resend email delivery failed: ${error.message}`);
            }

            console.log(`[EmailService] Invitation email sent successfully via Resend to: ${email}`);
            return true;
        } catch (resendErr: any) {
            console.error('[EmailService] Resend exception:', resendErr);
            throw new Error(`Resend email delivery failed: ${resendErr.message || resendErr}`);
        }
    }

    console.error('[EmailService] No email provider configured');
    throw new Error('Email service configuration missing. Please configure SMTP or RESEND_API_KEY in environment.');
};