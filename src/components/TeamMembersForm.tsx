'use client';

import { useState, useEffect } from 'react';
import { Project, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  project: Project & { members: User[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamMembersForm({ project, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        // Filter out users that are already members of the project
        const filteredUsers = users.filter(
          (user: User) => !project.members.some(member => member.id === user.id)
        );
        setAvailableUsers(filteredUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load available users');
      }
    };

    fetchUsers();
  }, [project.members]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: Number(selectedUserId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
      }

      setSelectedUserId('');
      setSearchTerm('');
      setOpenCombobox(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Popover.Root open={openCombobox} onOpenChange={setOpenCombobox}>
              <Popover.Trigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="flex-1 justify-between"
                  disabled={isSaving}
                  type="button"
                >
                  {selectedUserId
                    ? availableUsers.find(user => String(user.id) === selectedUserId)?.name
                    : "Select a user..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                  align="start"
                  sideOffset={5}
                >
                  <div className="flex items-center border-b px-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="relative flex w-full cursor-default select-none items-center rounded-sm px-3 py-2 text-sm text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                            selectedUserId === String(user.id) && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedUserId(selectedUserId === String(user.id) ? "" : String(user.id));
                            setSearchTerm(user.name);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === String(user.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.name}
                        </div>
                      ))
                    )}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <Button type="submit" disabled={isSaving || !selectedUserId}>
              Add
            </Button>
          </form>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            {project.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                <span>{member.name}</span>
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
