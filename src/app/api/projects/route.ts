import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, startDate, memberIds = [], sprintStartDay } = await request.json();

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        sprintStartDay: sprintStartDay || 1,
        ...(memberIds.length > 0 && {
          members: {
            connect: memberIds.map((id: number) => ({ id })),
          },
        }),
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
