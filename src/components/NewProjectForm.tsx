'use client';

import { FormDialog } from '@/components/ui/form-dialog';
import ProjectForm, { ProjectFormData } from './ProjectForm';
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectForm({ open, onOpenChange }: Props) {
  const { submit, isSubmitting, error } = useFormSubmit({
    onSuccess: () => onOpenChange(false)
  });

  const handleSubmit = async (data: ProjectFormData) => {
    await submit('/api/projects', {
      data: {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        memberIds: [],
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Project"
      description="Fill in the project details below. Click create when you're done."
    >
      <ProjectForm
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        submitLabel="Create Project"
        isSubmitting={isSubmitting}
        error={error}
      />
    </FormDialog>
  );
}
