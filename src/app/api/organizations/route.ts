import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations for the authenticated user
 *     description: Retrieves a list of all organizations where the authenticated user is a member
 *     tags:
 *       - Organizations
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: List of organizations successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Organization ID
 *                   name:
 *                     type: string
 *                     description: Organization name
 *                   description:
 *                     type: string
 *                     description: Organization description
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Creation timestamp
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Last update timestamp
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
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizations = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: true,
      },
    });

    return NextResponse.json(
      organizations.map((member) => member.organization)
    );
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     description: Creates a new organization with the authenticated user as the owner
 *     tags:
 *       - Organizations
 *     security:
 *       - session: []
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
 *                 description: Name of the organization
 *               description:
 *                 type: string
 *                 description: Description of the organization
 *     responses:
 *       200:
 *         description: Organization successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Organization ID
 *                 name:
 *                   type: string
 *                   description: Organization name
 *                 description:
 *                   type: string
 *                   description: Organization description
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
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
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, description } = await request.json();

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: user.id,
            role: UserRole.OWNER,
          },
        },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
