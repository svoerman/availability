'use client';

import { useState } from 'react';
import { Project } from '@prisma/client';
import { Button } from '@/components/ui/button';
import TeamMembersForm from '@/components/TeamMembersForm';
import { Users } from 'lucide-react';

interface Props {
  project: Project & { 
    members: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    }[];
    organization: {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      description: string | null;
    } | null;
  };
}

export default function TeamMembersButton({ project }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Users className="w-4 h-4 mr-2" />
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
