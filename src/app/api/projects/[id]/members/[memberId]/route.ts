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

    // Create a new ProjectMember
    await prisma.projectMember.create({
      data: {
        project: {
          connect: { id: projectId }
        },
        user: {
          connect: { id: memberId }
        },
        role: 'MEMBER'
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding member to project:', error instanceof Error ? error.message : error);
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

    // Delete the ProjectMember
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: memberId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member from project:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to remove member from project' }, { status: 500 });
  }
}
