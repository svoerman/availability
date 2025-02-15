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
 *       403:
 *         description: User is not a member of the organization
 *       404:
 *         description: Organization or user not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update organization
 *     description: Update an organization's details. User must be authenticated and an admin of the organization.
 *     tags:
 *       - Organizations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       400:
 *         description: Invalid request body or organization ID
 *       401:
 *         description: User is not authenticated
 *       403:
 *         description: User is not an admin or owner of the organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete organization
 *     description: Delete an organization. User must be authenticated and an owner of the organization.
 *     tags:
 *       - Organizations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *       400:
 *         description: Invalid organization ID
 *       401:
 *         description: User is not authenticated
 *       403:
 *         description: User is not an owner of the organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z, type ZodError } from 'zod';
import { UserRole } from '@prisma/client';

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export async function GET(
  request: NextRequest
) {
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

    const organizationId = lastPart;
    if (!organizationId) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Check if user is a member of the organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          where: { 
            organizationId,
            role: { in: [UserRole.ADMIN, UserRole.OWNER] }
          },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Must be an admin or owner' }, { status: 403 });
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

export async function PATCH(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.pathname.split('/')[3];
    if (!organizationId) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Check if user is an admin or owner of the organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          where: { 
            organizationId,
            role: { in: [UserRole.ADMIN, UserRole.OWNER] }
          }
        }
      }
    });

    if (!user?.organizations.length) {
      return NextResponse.json(
        { error: 'Forbidden: Must be an admin or owner' }, 
        { status: 403 }
      );
    }

    const json = await request.json();
    const validatedData = updateOrganizationSchema.safeParse(json) as { success: true; data: UpdateOrganizationInput } | { success: false; error: ZodError };

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { name, description } = validatedData.data;

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: { name, description }
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.pathname.split('/')[3];
    if (!organizationId) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Only owners can delete organizations
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          where: { 
            organizationId,
            role: UserRole.OWNER
          }
        }
      }
    });

    if (!user?.organizations.length) {
      return NextResponse.json(
        { error: 'Forbidden: Must be an owner' },
        { status: 403 }
      );
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
