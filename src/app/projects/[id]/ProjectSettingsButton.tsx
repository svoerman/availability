'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProjectSettingsForm from '@/components/ProjectSettingsForm';
import { Project } from '@prisma/client';

interface ProjectSettingsButtonProps {
  project: Project;
}

export default function ProjectSettingsButton({ project }: ProjectSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Edit Project
      </Button>
      <ProjectSettingsForm 
        project={project} 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
}
