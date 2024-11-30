'use server';

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SprintCalendar from '@/components/SprintCalendar';

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function SprintsPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = parseInt(resolvedParams.id);
  
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sprints: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>
      <SprintCalendar project={project} />
    </div>
  );
}
