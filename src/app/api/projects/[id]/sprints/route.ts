import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.pathname.split('/')[3];
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json(sprints);
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch sprints: ${error}` }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.pathname.split('/')[3];
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { startDate } = await request.json();
    const sprint = await prisma.sprint.create({
      data: {
        startDate: new Date(startDate),
        projectId,
      },
    });
    return NextResponse.json(sprint);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create sprint: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.pathname.split('/')[3];
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { startDate } = await request.json();
    const sprint = await prisma.sprint.deleteMany({
      where: {
        projectId,
        startDate: new Date(startDate),
      },
    });
    return NextResponse.json(sprint);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete sprint: ${error}` },
      { status: 500 }
    );
  }
}
