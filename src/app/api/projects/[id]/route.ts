/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update a project
 *     description: Update an existing project's details. Requires authentication.
 *     tags:
 *       - Projects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Project start date
 *               sprintStartDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *                 description: Day of the week when sprints start
 *               organizationId:
 *                 type: integer
 *                 description: ID of the organization this project belongs to
 *     responses:
 *       200:
 *         description: Project successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Project ID
 *                     name:
 *                       type: string
 *                       description: Project name
 *                     description:
 *                       type: string
 *                       description: Project description
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       description: Project start date
 *                     sprintStartDay:
 *                       type: integer
 *                       description: Day of the week when sprints start
 *                     organizationId:
 *                       type: integer
 *                       description: Organization ID
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Project name is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred
 */
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
