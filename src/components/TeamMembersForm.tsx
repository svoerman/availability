'use client';

import { useState, useTransition, useEffect } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface Props {
  project: {
    id: string;
    name: string;
    organizationId: string | null;
    members: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    }[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamMembersForm({ project, open, onOpenChange }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [_openCombobox, _setOpenCombobox] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isPending, startTransition] = useTransition();

  const { submit, isSubmitting, error, success, setError } = useFormSubmit({
    successMessage: 'Team member added successfully!'
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setOrganizationMembers([]);
      setSelectedUserId(null);
      setSearchTerm('');
    }
  }, [open]);

  // Fetch members when dialog opens
  useEffect(() => {
    if (open && project?.organizationId && organizationMembers.length === 0 && !isPending) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/organizations/${project.organizationId}/members`);
          if (!response.ok) throw new Error('Failed to fetch members');
          const members = await response.json();
          setOrganizationMembers(members);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch members');
        }
      });
    }
  }, [open, project?.organizationId, organizationMembers.length, isPending, setError, project.members]);

  const availableMembers = organizationMembers.filter(member => {
    const isMember = project.members.some(projectMember => projectMember.user.id === member.id);
    return !isMember;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a team member');
      return;
    }

    if (!isSubmitting) {
      await startTransition(() => {
        submit(`/api/projects/${project.id}/members/${selectedUserId}`, {
          method: 'POST',
          data: {}, // Add an empty data object
        });
      });
    }

    setSelectedUserId(null);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add team member"
      description="Add a new member to your team."
      error={error}
      success={success}
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative">
          <Command className="rounded-lg border shadow-md overflow-hidden">
            <CommandInput 
              placeholder="Search members..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-none focus:ring-0"
            />
            <CommandList className="max-h-[200px] overflow-auto">
              <CommandEmpty className="py-6 text-center text-sm">No members found.</CommandEmpty>
              <CommandGroup>
                {isPending ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Loading members...</div>
                ) : (
                  availableMembers
                    .filter(user => 
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedUserId(user.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedUserId === user.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </CommandItem>
                    ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={!selectedUserId || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Member'}
        </Button>

        {project.members.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Current Team Members</h3>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{member.user.name}</div>
                    <div className="text-sm text-gray-500 truncate">{member.user.email}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => submit(`/api/projects/${project.id}/members/${member.user.id}`, {
                      method: 'DELETE',
                      data: {},
                    })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </FormDialog>
  );
}
