/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     description: Retrieves an organization's details including its members. User must be authenticated and a member of the organization.
 *     tags:
 *       - Organizations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization details successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                   description: Organization ID
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: User is not a member of the organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Not a member of this organization
 *       404:
 *         description: Organization or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Organization not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest
) {
  const { searchParams } = request.nextUrl;
   try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pathParts = request.nextUrl.pathname.split('/');
    const lastPart = pathParts.pop();
    if (!lastPart) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const organizationId = parseInt(lastPart);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Check if user is a member of the organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          where: { organizationId },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (err) {
    console.error('Error fetching organization:', err);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
