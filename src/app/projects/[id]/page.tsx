import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import ProjectSettingsButton from './ProjectSettingsButton';
import TeamMembersButton from './TeamMembersButton';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ id: string }>;
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
      include: { members: true },
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

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      console.error('Invalid project ID in metadata:', resolvedParams.id);
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found',
      };
    }

    const project = await getProjectData(id);
    
    if (!project) {
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found',
      };
    }

    return {
      title: `Project: ${project.name}`,
      description: project.description || 'Project details and settings',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while loading the project',
    };
  }
}

export default async function ProjectPage({
  params,
}: Props) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      console.error('Invalid project ID in URL:', resolvedParams.id);
      notFound();
    }

    const project = await getProjectData(id);
    if (!project) {
      console.error('Project not found:', id);
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back
              </Button>
            </Link>
            <div className="flex gap-2">
              <TeamMembersButton project={project} />
              <ProjectSettingsButton project={project} />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
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
