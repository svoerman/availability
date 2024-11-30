'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  project: { id: number; name: string; organizationId: number; members: { id: number; name: string; email: string }[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamMembersForm({ project, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

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
          (user: { id: number; name: string; email: string }) => !project.members.some((member: { id: number; name: string; email: string }) => member.id === user.id)
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
  }, [project.organizationId, project.members, open]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(selectedUserId, 10) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add team member');
      }

      setSelectedUserId(null);
      setSearchTerm('');
      setOpenCombobox(false);
      router.refresh();
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members?userId=${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error;
        } catch {
          errorMessage = 'Failed to remove team member';
        }
        throw new Error(errorMessage);
      }

      router.refresh();
    } catch (err) {
      console.error('Error removing team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove team member');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
          <DialogDescription>
            Add or remove team members for {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleAddMember} className="flex gap-2">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn(
                    "w-[200px] justify-between",
                    !selectedUserId && "text-muted-foreground"
                  )}
                >
                  {selectedUserId
                    ? availableUsers.find((user) => user.id === parseInt(selectedUserId, 10))?.name
                    : "Select user..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command className="flex flex-col">
                  <CommandInput 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <div className="flex-1 overflow-hidden">
                    <CommandList className="h-[200px] overflow-y-auto">
                      <CommandEmpty>No users found</CommandEmpty>
                      <CommandGroup>
                        {availableUsers
                          .filter(user => {
                            if (!searchTerm) return true;
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              (user.name?.toLowerCase() || '').includes(searchLower) ||
                              user.email.toLowerCase().includes(searchLower)
                            );
                          })
                          .map(user => (
                            <CommandItem
                              key={user.id}
                              value={user.name || user.email}
                              onSelect={() => {
                                setSelectedUserId(user.id.toString());
                                setOpenCombobox(false);
                              }}
                              className="flex items-center justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                              {selectedUserId === user.id.toString() && (
                                <Check className="ml-2 h-4 w-4 shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            <Button type="submit" disabled={isSaving || !selectedUserId}>
              Add
            </Button>
          </form>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            {project.members.map((member: { id: number; name: string; email: string }) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex flex-col">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-sm text-muted-foreground">{member.email}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isSaving}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
