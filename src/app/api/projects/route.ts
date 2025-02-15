import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     description: Retrieves a list of all projects from organizations where the authenticated user is a member
 *     tags:
 *       - Projects
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: List of projects successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Project ID
 *                   name:
 *                     type: string
 *                     description: Project name
 *                   description:
 *                     type: string
 *                     description: Project description
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     description: Project start date
 *                   sprintStartDay:
 *                     type: integer
 *                     description: Day of the week when sprints start (1-7)
 *                   organizationId:
 *                     type: integer
 *                     description: ID of the organization this project belongs to
 *                   members:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: User ID
 *                         name:
 *                           type: string
 *                           description: User name
 *                         email:
 *                           type: string
 *                           description: User email
 *                   organization:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Organization ID
 *                       name:
 *                         type: string
 *                         description: Organization name
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
 *                   example: Error fetching projects
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          select: {
            organizationId: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationIds = user.organizations.map((member: { organizationId: string }) => member.organizationId);

    const projects = await prisma.project.findMany({
      where: {
        organizationId: {
          in: organizationIds
        }
      },
      include: {
        members: true,
        organization: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project within an organization. User must be a member of the organization.
 *     tags:
 *       - Projects
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
 *               - startDate
 *               - organizationId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the project
 *               description:
 *                 type: string
 *                 description: Description of the project
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Project start date
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of user IDs to add as project members
 *               sprintStartDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *                 description: Day of the week when sprints start (1-7, defaults to 1)
 *               organizationId:
 *                 type: integer
 *                 description: ID of the organization this project belongs to
 *     responses:
 *       200:
 *         description: Project successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Project ID
 *                 name:
 *                   type: string
 *                   description: Project name
 *                 description:
 *                   type: string
 *                   description: Project description
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   description: Project start date
 *                 sprintStartDay:
 *                   type: integer
 *                   description: Day of the week when sprints start
 *                 organizationId:
 *                   type: integer
 *                   description: Organization ID
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
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Organization ID
 *                     name:
 *                       type: string
 *                       description: Organization name
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

    const { name, description, startDate, memberIds = [], sprintStartDay, organizationId } = await request.json();

    // Verify user is a member of the organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      );
    }

    // First create the project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        sprintStartDay: sprintStartDay || 1,
        organization: {
          connect: { id: organizationId }
        },
        createdBy: {
          connect: { id: user.id }
        },
      },
    });

    // Then create ProjectMember records for all members
    const memberPromises = [
      // Always add the creator
      prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
        },
      }),
      // Add other members if specified
      ...(memberIds || []).map((id: string) =>
        prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: id,
          },
        })
      ),
    ];

    await Promise.all(memberPromises);

    // Fetch the complete project with members
    const completeProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        organization: true,
      },
    });

    if (!completeProject) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json(completeProject);
  } catch (error) {
    console.error('Error creating project:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
