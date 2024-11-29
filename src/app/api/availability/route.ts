import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const availability = await prisma.availability.findMany({
      include: {
        user: true,
      },
    });
    return NextResponse.json(availability);
  } catch (error) {
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
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
