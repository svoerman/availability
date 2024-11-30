import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json(sprints);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
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
      { error: 'Failed to create sprint' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
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
      { error: 'Failed to delete sprint' },
      { status: 500 }
    );
  }
}
