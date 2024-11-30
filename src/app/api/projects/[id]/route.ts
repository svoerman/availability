import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    const body = await req.json();
    
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: {
        id
      },
      data: {
        name: body.name,
        description: body.description,
        startDate: new Date(body.startDate),
        sprintStartDay: body.sprintStartDay,
      }
    });
    
    return NextResponse.json({
      success: true,
      project: updated
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('Error:', error);
    
    // Add Prisma-specific error handling
    if (error instanceof PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: 'Unique constraint violation'
        }, { status: 400 });
      }
    }
    
    // Handle other types of errors
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An unexpected error occurred';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}
