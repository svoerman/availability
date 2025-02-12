import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { Invitation, Organization, User } from '@prisma/client';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Check if user has permission to invite members
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: params.id,
        userId: session.user.id,
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
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: email is required' },
        { status: 400 }
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
        inviterId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        organization: true,
        inviter: true,
      },
    }) as Invitation & { organization: Organization; inviter: User };

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    
    try {
      console.log('Attempting to send invitation email to:', email);
      const emailResult = await resend.emails.send({
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

      if (!emailResult.id) {
        console.error('Email send failed - no ID returned:', emailResult);
        throw new Error(`Failed to send email: no email ID returned. Full response: ${JSON.stringify(emailResult)}`);
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
