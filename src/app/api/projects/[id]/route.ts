import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

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
        organizationId: body.organizationId
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
