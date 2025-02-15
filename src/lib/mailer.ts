import { createTransport } from 'nodemailer';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const smtpConfig: SMTPConfig = {
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
  },
};

export const transporter = createTransport(smtpConfig);
