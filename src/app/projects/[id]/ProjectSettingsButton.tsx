'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ProjectSettingsForm from '@/components/ProjectSettingsForm';
import { Project } from '@prisma/client';
import { Pencil } from 'lucide-react';

interface ProjectSettingsButtonProps {
  project: Project;
}

export default function ProjectSettingsButton({ project }: ProjectSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Pencil className="w-4 h-4 mr-2" />
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
