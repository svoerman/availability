import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import ProjectSettingsButton from './ProjectSettingsButton';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getProjectData(projectId: number) {
  try {
    return await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  
  if (isNaN(id)) {
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
}

export default async function ProjectPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) notFound();

  const project = await getProjectData(id);
  if (!project) notFound();

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
          <ProjectSettingsButton project={project} />
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
}
