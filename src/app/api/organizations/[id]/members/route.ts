import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const organizationId = Number(segments[segments.length - 2]);
    console.log('Fetching organization members for organization:', organizationId);

    if (isNaN(organizationId)) {
      console.error('Invalid organization ID');
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organizationId
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: `Internal Server Error ${error}` }, { status: 500 });
  }
}
