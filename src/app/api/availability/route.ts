import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Status, DayPart } from '@prisma/client';

const isValidStatus = (status: unknown): status is Status => {
  return ['FREE', 'NOT_WORKING', 'PARTIALLY_AVAILABLE', 'WORKING'].includes(status as string);
};

const isValidDayPart = (dayPart: unknown): dayPart is DayPart => {
  return ['MORNING', 'AFTERNOON', 'EVENING'].includes(dayPart as string);
};

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

    // Validate input
    if (!userId || !date || !dayPart || status === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status and dayPart
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (!isValidDayPart(dayPart)) {
      return NextResponse.json(
        { error: 'Invalid dayPart value' },
        { status: 400 }
      );
    }

    // Validate userId is a number
    const userIdNum = Number(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid userId' },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.upsert({
      where: {
        userId_date_dayPart: {
          userId: userIdNum,
          date: new Date(date),
          dayPart,
        },
      },
      update: {
        status,
      },
      create: {
        userId: userIdNum,
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
