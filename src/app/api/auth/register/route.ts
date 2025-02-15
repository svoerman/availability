/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided details
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: User ID
 *                 name:
 *                   type: string
 *                   description: User's full name
 *                 email:
 *                   type: string
 *                   description: User's email address
 *       400:
 *         description: Bad request - Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const invitationToken = url.searchParams.get('invitation');
  console.log('Registration request URL:', request.url);
  console.log('Invitation token:', invitationToken);
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating new user with email:', email);
    // Create user
    // Create user and handle invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

      // If we have an invitation token, accept it
      if (invitationToken) {
        console.log('Found invitation token:', invitationToken);
        const invitation = await tx.invitation.findUnique({
          where: { token: invitationToken },
          include: { organization: true }
        });
        console.log('Found invitation:', invitation);

        if (!invitation) {
          console.log('No invitation found for token');
        } else if (invitation.status !== 'PENDING') {
          console.log('Invitation status is not pending:', invitation.status);
        } else {
          console.log('Found valid pending invitation');
          console.log('Creating organization membership...');
          // Create organization membership
          const membership = await tx.organizationMember.create({
            data: {
              organizationId: invitation.organizationId,
              userId: user.id,
              role: 'MEMBER',
            },
          });

          console.log('Created organization membership:', membership);

          // If there's project metadata, add to project
          if (invitation.invitationMetadata) {
            console.log('Found invitation metadata:', invitation.invitationMetadata);
            try {
              const metadata = JSON.parse(invitation.invitationMetadata);
              console.log('Parsed metadata:', metadata);
              if (metadata.projectId) {
                console.log('Creating project membership...');
                // Verify the project exists and belongs to the organization
                const project = await tx.project.findUnique({
                  where: { id: metadata.projectId },
                });

                if (!project || project.organizationId !== invitation.organizationId) {
                  throw new Error('Invalid project for this organization');
                }

                // Update user to connect with project
                await tx.user.update({
                  where: { id: user.id },
                  data: {
                    projects: {
                      connect: { id: metadata.projectId }
                    }
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing invitation metadata:', e);
            }
          }

          // Update invitation status
          await tx.invitation.update({
            where: { token: invitationToken },
            data: { status: 'ACCEPTED' },
          });

          // Return user and organization info
          return {
            user,
            organizationId: invitation.organizationId,
          };
        }
      }

      // Just return the user if no invitation
      return { user };
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.user;

    return NextResponse.json({
      ...userWithoutPassword,
      organizationId: result.organizationId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    console.error('Registration error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
