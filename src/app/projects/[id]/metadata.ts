import { Metadata } from 'next';
import { prisma } from '@/lib/db';

async function getProject(id: number) {
  return prisma.project.findUnique({
    where: { id },
    select: { name: true, description: true },
  });
}

interface MetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  
  if (isNaN(id)) {
    return {
      title: 'Project Not Found',
      description: 'The requested project could not be found',
    };
  }

  const project = await getProject(id);
  
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
