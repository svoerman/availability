import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { Invitation, Organization, User } from '@prisma/client';
import { createTransport } from 'nodemailer';
import { isEmail } from '@/lib/utils'; // Fix email validation import

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SMTPConfigValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSMTPConfig(config: SMTPConfig): SMTPConfigValidationResult {
  const errors: string[] = [];

  if (!config.host) {
    errors.push('SMTP host is required');
  }

  if (!config.port || typeof config.port !== 'number') {
    errors.push('SMTP port is required and must be a number');
  }

  if (typeof config.secure !== 'boolean') {
    errors.push('SMTP secure must be a boolean');
  }

  if (!config.auth || !config.auth.user || !config.auth.pass) {
    errors.push('SMTP auth user and pass are required');
  }

  return {
    valid: errors.length === 0,
    errors,
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

const smtpConfigValidationResult = validateSMTPConfig(smtpConfig);

if (!smtpConfigValidationResult.valid) {
  throw new Error(`Invalid SMTP configuration: ${smtpConfigValidationResult.errors.join(', ')}`);
}

const transporter = createTransport(smtpConfig);

if (!process.env.SMTP_HOST) {
  throw new Error('SMTP_HOST is not set in environment variables');
}

if (!process.env.SMTP_PORT) {
  throw new Error('SMTP_PORT is not set in environment variables');
}

if (!process.env.SMTP_SECURE) {
  throw new Error('SMTP_SECURE is not set in environment variables');
}

if (!process.env.SMTP_USER) {
  throw new Error('SMTP_USER is not set in environment variables');
}

if (!process.env.SMTP_PASSWORD) {
  throw new Error('SMTP_PASSWORD is not set in environment variables');
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables');
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to invite members
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: params.id,
        userId: user.id,
        role: {
          in: [UserRole.OWNER, UserRole.ADMIN],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to invite members' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    console.log('Invitation request body:', JSON.stringify(body, null, 2));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: email is required' },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log('Organization ID:', params.id);
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
    });

    if (!organization) {
      console.error('Organization not found:', params.id);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organization: { id: params.id },
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Check if there's an existing invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: params.id,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        organizationId: params.id,
        inviterId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        organization: true,
        inviter: true,
      },
    }) as Invitation & { organization: Organization; inviter: User };

    console.log('Validation result:', { success: true });
    if (!true) {
      console.error('Validation errors:', []);
      return NextResponse.json(
        { 
          error: "Invalid invitation data",
          details: []
        },
        { status: 400 }
      );
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    
    try {
      console.log('Attempting to send invitation email to:', email);
      const emailResult = await transporter.sendMail({
        from: 'Availability <agile@agile.pixelgilde.nl>',
        to: email,
        subject: `Invitation to join ${invitation.organization.name}`,
        html: `
          <h1>You've been invited!</h1>
          <p>${invitation.inviter.name} has invited you to join ${invitation.organization.name} on Availability.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteUrl}">${inviteUrl}</a>
          <p>This invitation will expire in 7 days.</p>
        `,
      });

      console.log('Email send result:', emailResult);

      if (!emailResult?.accepted?.length) {
        console.error('Email send failed - no accepted addresses:', emailResult);
        throw new Error(`Failed to send email: no accepted addresses. Full response: ${JSON.stringify(emailResult)}`);
      }

      console.log('Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Return error to client but don't delete the invitation
      return NextResponse.json(
        { error: 'Invitation created but email sending failed. Please try again or contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
