import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the user is a member of the organization
    const isMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: parseInt(params.id),
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get all users who are members of this organization
    const organizationUsers = await prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organizationId: parseInt(params.id),
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(organizationUsers);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json(
      { error: 'Error fetching organization users' },
      { status: 500 }
    );
  }
}
