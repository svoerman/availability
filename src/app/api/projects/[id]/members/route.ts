/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add a member to a project
 *     description: Adds a user as a member to the specified project. Requires authentication.
 *     tags:
 *       - Projects
 *       - Members
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to add to the project
 *     responses:
 *       200:
 *         description: Member successfully added to project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Project ID
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                       name:
 *                         type: string
 *                         description: User name
 *                       email:
 *                         type: string
 *                         description: User email
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid project ID
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to add member to project
 *   delete:
 *     summary: Remove a member from a project
 *     description: Removes a user from the specified project. Requires authentication.
 *     tags:
 *       - Projects
 *       - Members
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to remove from the project
 *     responses:
 *       200:
 *         description: Member successfully removed from project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Project ID
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                       name:
 *                         type: string
 *                         description: User name
 *                       email:
 *                         type: string
 *                         description: User email
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid user ID
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to remove member from project
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(request.nextUrl.pathname.split('/')[3]);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update project to connect the user
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error adding member to project:', error);
    return NextResponse.json({ error: 'Failed to add member to project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(request.nextUrl.pathname.split('/')[3]);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get the user ID from query parameters
    const userId = Number(request.nextUrl.searchParams.get('userId'));
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Update project to disconnect the user
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error removing member from project:', error);
    return NextResponse.json({ error: 'Failed to remove member from project' }, { status: 500 });
  }
}
