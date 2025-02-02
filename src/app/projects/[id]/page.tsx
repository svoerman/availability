import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import ProjectSettingsButton from './ProjectSettingsButton';
import TeamMembersButton from './TeamMembersButton';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Project, User } from '@prisma/client';

type Props = {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | undefined }>
}

async function getProjectData(projectId: string) {
  if (!projectId) {
    console.error('Invalid project ID:', projectId);
    return null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        members: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: true
      },
    });

    if (!project) {
      console.error('Project not found:', projectId);
    }

    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

async function verifyUserAccess(projectId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      organizations: {
        select: {
          organizationId: true
        }
      }
    }
  });

  if (!user) return false;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (!project) return false;

  return user.organizations.some(member => member.organizationId === project.organizationId);
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;
  const project = await getProjectData(projectId);

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: project.name,
  }
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const resolvedParams = await params;
  if (!resolvedParams) {
    notFound();
  }

  try {
    const projectId = resolvedParams.id;
    
    if (!projectId) {
      console.error('Invalid project ID in URL:', resolvedParams.id);
      notFound();
    }

    // Verify user has access to this project's organization
    const hasAccess = await verifyUserAccess(projectId, session.user.email);
    if (!hasAccess) {
      console.error('User does not have access to this project:', projectId);
      redirect("/projects");
    }

    const project = await getProjectData(projectId);
    if (!project) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="space-x-4">
              <Link href={`/projects/${project.id}/sprints`}>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Sprints
                </Button>
              </Link>
              {project.organizationId && (
                <TeamMembersButton project={project} />
              )}
              <ProjectSettingsButton project={project} />
            </div>
          </div>

          <div>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>

          <AvailabilityGrid project={project} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering project page:', error);
    notFound();
  }
}
