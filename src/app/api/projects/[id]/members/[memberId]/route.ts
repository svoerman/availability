import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const projectId = Number(params.id);
    const memberId = Number(params.memberId);

    if (isNaN(projectId) || isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid project or member ID' },
        { status: 400 }
      );
    }

    // Only disconnect the user from the project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member from project:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from project' },
      { status: 500 }
    );
  }
}
