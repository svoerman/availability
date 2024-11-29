import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get all members of the project
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        members: {
          select: { id: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get availability for all project members
    const availability = await prisma.availability.findMany({
      where: {
        userId: {
          in: project.members.map(member => member.id)
        }
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, date, dayPart, status } = await request.json();
    const availability = await prisma.availability.upsert({
      where: {
        userId_date_dayPart: {
          userId,
          date: new Date(date),
          dayPart,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        date: new Date(date),
        dayPart,
        status,
      },
    });
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
