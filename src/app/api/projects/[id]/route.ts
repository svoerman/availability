import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = Number(context.params.id);
    const body = await req.json();
    
    if (!body.name?.trim()) {
      return new Response(JSON.stringify({
        error: 'Project name is required'
      }), { status: 400 });
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
    
    return new Response(JSON.stringify({
      success: true,
      project: updated
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('Error:', error);
    
    // Add Prisma-specific error handling
    if (error instanceof prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return new Response(JSON.stringify({
          error: 'Unique constraint violation'
        }), { status: 400 });
      }
    }
    
    // Handle other types of errors
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An unexpected error occurred';
    
    return new Response(JSON.stringify({
      error: errorMessage
    }), { status: 500 });
  }
}
