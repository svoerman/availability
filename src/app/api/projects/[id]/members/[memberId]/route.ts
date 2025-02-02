import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const projectId = segments[segments.length - 3];
    const memberId = segments[segments.length - 1];

    if (!projectId || !memberId) {
      return NextResponse.json({ error: 'Invalid project or member ID' }, { status: 400 });
    }

    // Connect the user to the project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: memberId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding member to project:', error);
    return NextResponse.json({ error: 'Failed to add member to project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const projectId = segments[segments.length - 3];
    const memberId = segments[segments.length - 1];

    if (!projectId || !memberId) {
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
