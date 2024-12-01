'use client';

import { useState, useTransition, useEffect } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface Props {
  project: {
    id: number;
    name: string;
    organizationId: number;
    members: { id: number; name: string; email: string }[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamMembersForm({ project, open, onOpenChange }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState<Array<{ id: number; name: string; email: string }>>([]);
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
    const isMember = project.members.some(projectMember => projectMember.id === member.id);
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
      <form onSubmit={handleSubmit}>
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="w-full justify-between"
            >
              {selectedUserId ? 
                availableMembers.find(user => user.id.toString() === selectedUserId)?.name : 
                "Select member..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput
                placeholder="Search members..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {isPending ? (
                    <div className="p-4 text-sm text-gray-500">Loading members...</div>
                  ) : (
                    availableMembers
                      .filter(user => 
                        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name.toLowerCase()}
                          onSelect={() => {
                            setSelectedUserId(user.id.toString());
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div>{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </CommandItem>
                      ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={!selectedUserId || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Member'}
        </Button>
        {project.members.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Current Team Members</h3>
            <div className="space-y-2">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <div>{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => submit(`/api/projects/${project.id}/members/${member.id}`, {
                      method: 'DELETE',
                      data: {}, // Add an empty data object
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
