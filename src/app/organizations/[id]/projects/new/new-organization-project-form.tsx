'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Organization } from '@prisma/client';
import ProjectForm, { ProjectFormData } from '@/components/ProjectForm';

interface Props {
  organization: Organization;
}

export default function NewOrganizationProjectForm({ organization }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organization.id}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate).toISOString(),
          sprintStartDay: data.sprintStartDay,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create project');
      }

      const project = await response.json();
      toast.success('Project created successfully');
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      submitLabel="Create Project"
      isSubmitting={isSubmitting}
      error={error}
      initialData={{
        organizationId: organization.id,
      }}
    />
  );
}
