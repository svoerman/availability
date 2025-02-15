import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const params = await paramsPromise;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get invitation with organization details
      const invitation = await tx.invitation.findUnique({
        where: { token: params.token },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Validate invitation status and expiration
      if (invitation.status !== 'PENDING') {
        throw new Error(`Invitation is ${invitation.status.toLowerCase()}`);
      }

      if (invitation.expiresAt < new Date()) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new Error('Invitation has expired');
      }

      // Verify the invitation is for the authenticated user
      if (!session?.user?.email || invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
        throw new Error('Invitation is for a different email address');
      }

      // Check if user is already a member
      const existingMembership = await tx.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          user: { email: session.user?.email },
        },
      });

      if (existingMembership) {
        throw new Error('You are already a member of this organization');
      }

      // Get user ID
      const user = await tx.user.findUnique({
        where: { email: session.user?.email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create organization membership
      const membership = await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: UserRole.MEMBER,
        },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return {
        membership,
        organization: invitation.organization,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
