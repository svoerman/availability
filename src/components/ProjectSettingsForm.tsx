'use client';

import { Project } from '@prisma/client';
import { FormDialog } from '@/components/ui/form-dialog';
import ProjectForm, { ProjectFormData } from './ProjectForm';
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface Props {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectSettingsForm({ project, open, onOpenChange }: Props) {
  const { submit, isSubmitting, error } = useFormSubmit({
    onSuccess: () => onOpenChange(false)
  });

  const handleSubmit = async (data: ProjectFormData) => {
    await submit(`/api/projects/${project.id}`, {
      method: 'PATCH',
      data: {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        organizationId: Number(data.organizationId)
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Project Settings"
      description="Update your project settings below. Click save when you're done."
    >
      <ProjectForm
        initialData={project}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        error={error}
      />
    </FormDialog>
  );
}
