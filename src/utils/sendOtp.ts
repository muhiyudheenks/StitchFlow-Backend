// import nodemailer from "nodemailer";
// import fs from "fs";
// import path from "path";

// const logFilePath = path.join(__dirname, "../../../smtp.log");

// const logToFile = (message: string, data?: any) => {
//     const timestamp = new Date().toISOString();
//     const dataStr = data ? `\nData: ${typeof data === "object" ? JSON.stringify(data, null, 2) : data}` : "";
//     const logLine = `[${timestamp}] ${message}${dataStr}\n`;
//     fs.appendFileSync(logFilePath, logLine, "utf8");
//     console.log(message, data || "");
// };

// logToFile("[SMTP CONFIG] HOST: " + process.env.SMTP_HOST);
// logToFile("[SMTP CONFIG] PORT: " + process.env.SMTP_PORT);
// logToFile("[SMTP CONFIG] USER: " + process.env.SMTP_USER);
// logToFile("[SMTP CONFIG] FROM: " + process.env.EMAIL_FROM);
// logToFile("[SMTP CONFIG] PASS EXISTS: " + !!process.env.SMTP_PASS);

// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     secure: false, // true for 465, false for other ports (like 587)
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// });

// // Verify the transporter connection configuration
// transporter.verify((error, success) => {
//     if (error) {
//         logToFile("[SMTP VERIFY ERROR] Verification failed", error);
//     } else {
//         logToFile("[SMTP VERIFY SUCCESS] Transporter is ready to send emails");
//     }
// });

// const sendOtp = async (email: string, code: string): Promise<any> => {
//     logToFile(`[SMTP] Attempting to send OTP email. To: ${email}, Code: ${code}`);
//     try {
//         const info = await transporter.sendMail({
//             from: process.env.EMAIL_FROM,
//             to: email,
//             subject: "Your StitchFlow OTP",
//             html: `<h2>Your OTP is: ${code}</h2>`,
//         });

//         logToFile("[SMTP SUCCESS] Full SMTP Response", info);
//         return info;
//     } catch (error) {
//         logToFile("[SMTP ERROR] Error sending email", error instanceof Error ? {
//             name: error.name,
//             message: error.message,
//             stack: error.stack
//         } : error);
//         throw error;
//     }
// };

// export default sendOtp;

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