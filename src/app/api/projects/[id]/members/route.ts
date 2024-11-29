import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = Number(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update project to connect the user
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error adding member to project:', error);
    return NextResponse.json(
      { error: 'Failed to add member to project' },
      { status: 500 }
    );
  }
}
