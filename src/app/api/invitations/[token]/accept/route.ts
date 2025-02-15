import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ token: string }> }
) {
  try {
    console.log('Starting invitation acceptance process');
    const session = await auth();
    console.log('Auth session:', session);
    
    if (!session?.user?.email) {
      console.log('No authenticated user found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const params = await paramsPromise;

    console.log('Starting transaction');
    console.log('Starting transaction');
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let createdMembership = null;
      // Get invitation with organization details
      console.log('Finding invitation with token:', params.token);
      const invitation = await tx.invitation.findUnique({
        where: { token: params.token },
        include: {
          organization: true,
        },
      });
      console.log('Found invitation:', invitation);

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Validate invitation status and expiration
      if (invitation.status !== 'PENDING') {
        throw new Error(`Invitation is ${invitation.status.toLowerCase()}`);
      }

      if (invitation.expiresAt < new Date()) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new Error('Invitation has expired');
      }

      // Verify the invitation is for the authenticated user
      if (!session?.user?.email || invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
        throw new Error('Invitation is for a different email address');
      }

      // Check if user is already a member
      const existingMembership = await tx.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          user: { email: session.user?.email },
        },
      });

      if (existingMembership) {
        throw new Error('You are already a member of this organization');
      }

      // Get or create user
      console.log('Looking for user with email:', session.user.email);
      let user = await tx.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        console.log('User not found in database');
        // Create user if they don't exist yet
        user = await tx.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0],
          }
        });
        console.log('Created new user:', user);
      } else {
        console.log('Found existing user:', user);
      }

      // Ensure we have a valid user
      if (!user || !user.id) {
        console.error('No valid user after create/find');
        throw new Error('Failed to get or create user');
      }

      // Create organization membership if it doesn't exist
      console.log('Creating organization membership:', {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: UserRole.MEMBER
      });
      
      // Create organization membership
      createdMembership = await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          }
        },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: UserRole.MEMBER,
        },
        update: {},
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });
      
      console.log('Created/updated organization membership:', createdMembership);
      
      if (!createdMembership) {
        throw new Error('Failed to create organization membership');
      }

      // If a project was specified in the invitation metadata, add the user to that project
      console.log('Checking invitation metadata:', invitation.invitationMetadata);
      let metadata = null;
      try {
        metadata = invitation.invitationMetadata ? JSON.parse(invitation.invitationMetadata) : null;
        console.log('Parsed metadata:', metadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
      
      if (metadata && typeof metadata === 'object' && 'projectId' in metadata) {
        const projectId = metadata.projectId;
        console.log('Found projectId in metadata:', projectId);
        
        // Verify project exists and belongs to the organization
        const project = await tx.project.findFirst({
          where: {
            id: projectId,
            organizationId: invitation.organizationId
          }
        });

        console.log('Found project:', project);

        if (project) {
          console.log('Adding user to project:', {
            projectId: project.id,
            userId: user.id
          });
          
          try {
            // Create project membership if it doesn't exist
            const projectMember = await tx.projectMember.upsert({
              where: {
                projectId_userId: {
                  projectId: project.id,
                  userId: user.id
                }
              },
              create: {
                projectId: project.id,
                userId: user.id
              },
              update: {}
            });
            console.log('Created/updated project membership:', projectMember);
          } catch (e) {
            console.error('Error creating project membership:', e);
            throw e;
          }
        }
      }

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      console.log('Transaction completed successfully');
      return {
        membership: createdMembership,
        organizationId: invitation.organizationId,
        organization: invitation.organization,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
