import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import ProjectSettingsButton from './ProjectSettingsButton';
import TeamMembersButton from './TeamMembersButton';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Pencil } from 'lucide-react';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getProjectData(projectId: number) {
  if (isNaN(projectId)) {
    console.error('Invalid project ID:', projectId);
    return null;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        members: true,
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

async function verifyUserAccess(projectId: number, userEmail: string) {
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

  return user.organizations.some(org => org.organizationId === project.organizationId);
}

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Ensure params.id is properly resolved
    const resolvedParams = await Promise.resolve(params);
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      console.error('Invalid project ID in metadata:', resolvedParams.id);
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found',
      };
    }
    
    const project = await prisma.project.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!project) {
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found',
      };
    }

    const parentMetadata = await parent;
    const previousImages = parentMetadata?.openGraph?.images || [];

    return {
      title: project.name,
      description: `Details for project ${project.name}`,
      openGraph: {
        title: project.name,
        description: `Details for project ${project.name}`,
        images: [...previousImages],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while generating metadata',
    };
  }
}

export default async function ProjectPage({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  try {
    // Ensure params.id is properly resolved
    const resolvedParams = await Promise.resolve(params);
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      console.error('Invalid project ID in URL:', resolvedParams.id);
      notFound();
    }

    // Verify user has access to this project's organization
    const hasAccess = await verifyUserAccess(id, session.user.email);
    if (!hasAccess) {
      console.error('User does not have access to this project:', id);
      redirect("/projects");
    }

    const project = await getProjectData(id);
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
                  <Calendar className="w-4 h-4 mr-2" />
                  Sprints
                </Button>
              </Link>
              <TeamMembersButton project={project} />
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
