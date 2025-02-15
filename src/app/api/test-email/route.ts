import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

export async function POST() {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_USER,
      subject: 'Test Email',
      text: 'This is a test email from Availability App',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email test failed:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
}
