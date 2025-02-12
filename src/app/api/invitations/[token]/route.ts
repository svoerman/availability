import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ token: string }> }
) {
  try {
    const params = await paramsPromise;
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Update status to EXPIRED if not already
      if (invitation.status === 'PENDING') {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
      }

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
