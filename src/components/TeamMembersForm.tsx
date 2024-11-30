'use client';

import { useState, useEffect } from 'react';
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
  const [availableUsers, setAvailableUsers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  const { submit, isSubmitting, error, success, setError } = useFormSubmit({
    successMessage: 'Team member added successfully!'
  });

  // Fetch organization users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!project.organizationId) {
        setError('Project is not associated with an organization');
        return;
      }

      try {
        const response = await fetch(`/api/organizations/${project.organizationId}/users`);
        if (!response.ok) throw new Error('Failed to fetch organization users');
        const users = await response.json();
        
        // Filter out users that are already members of the project
        const filteredUsers = users.filter(
          (user: { id: number }) => !project.members.some((member) => member.id === user.id)
        );
        setAvailableUsers(filteredUsers);
        setError(null);
      } catch (err) {
        console.error('Error fetching organization users:', err);
        setError('Failed to load available users');
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [project.organizationId, project.members, open, setError]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    await submit(`/api/projects/${project.id}/members`, {
      data: { userId: parseInt(selectedUserId, 10) }
    });

    setSelectedUserId(null);
    setSearchTerm('');
    setOpenCombobox(false);
  };

  const handleRemoveMember = async (memberId: number) => {
    await submit(`/api/projects/${project.id}/members?userId=${memberId}`, {
      method: 'DELETE',
      data: {},
      successMessage: 'Team member removed successfully!'
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Team Members"
      description="Add or remove team members from your project."
      maxWidth="600px"
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-500">{success}</div>
        )}
        <form onSubmit={handleAddMember} className="space-y-4">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
              >
                {selectedUserId
                  ? availableUsers.find((user) => user.id.toString() === selectedUserId)?.name
                  : "Select a user..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="Search users..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {availableUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id.toString()}
                        onSelect={(value) => {
                          setSelectedUserId(value === selectedUserId ? null : value);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === user.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            type="submit"
            disabled={!selectedUserId || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </form>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Current Members</h4>
          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
