import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/organizations/{id}/users:
 *   get:
 *     summary: Get all users in an organization
 *     description: Retrieves a list of all users who are members of the specified organization. Requires authentication and organization membership.
 *     tags:
 *       - Organizations
 *     security:
 *       - session: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Organization ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organization users successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: User ID
 *                   name:
 *                     type: string
 *                     description: User's full name
 *                   email:
 *                     type: string
 *                     description: User's email address
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
 *       403:
 *         description: Forbidden - User is not a member of the organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not a member of this organization
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       400:
 *         description: Invalid organization ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid organization ID
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching organization users
 */
export async function GET(
  request: NextRequest
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(request.nextUrl.pathname.split('/')[3]);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the user is a member of the organization
    const isMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId,
      },
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get all users who are members of this organization
    const organizationUsers = await prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organizationId: organizationId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(organizationUsers);
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json(
      { error: 'Error fetching organization users' },
      { status: 500 }
    );
  }
}
