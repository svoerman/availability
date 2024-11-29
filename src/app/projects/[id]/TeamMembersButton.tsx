'use client';

import { useState } from 'react';
import { Project, Member } from '@prisma/client';
import { Button } from '@/components/ui/button';
import TeamMembersForm from '@/components/TeamMembersForm';

interface Props {
  project: Project & { members: Member[] };
}

export default function TeamMembersButton({ project }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Team Members ({project.members.length})
      </Button>
      <TeamMembersForm 
        project={project} 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
}
