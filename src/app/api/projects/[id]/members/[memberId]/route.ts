import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = Number(searchParams.get('id'));
    const memberId = Number(searchParams.get('memberId'));

    if (isNaN(projectId) || isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid project or member ID' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to remove member from project' }, { status: 500 });
  }
}
