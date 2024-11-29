'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import NewProjectForm from './NewProjectForm';

export default function NewProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        New Project
      </Button>
      <NewProjectForm 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
}
