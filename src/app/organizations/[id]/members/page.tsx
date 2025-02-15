'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Organization, UserRole } from '@prisma/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

type OrganizationMember = {
  id: string;
  userId: string;
  role: UserRole;
  user: User;
};

type OrganizationWithMembers = Organization & {
  members: OrganizationMember[];
  projects: {
    id: string;
    name: string;
  }[];
};

export default function OrganizationMembersPage() {
  const params = useParams() ?? { id: '' };
  const id = params.id as string;
  const [organization, setOrganization] = useState<OrganizationWithMembers | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch organization and members data
  const fetchOrganization = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${id}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Unauthorized') {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw new Error(data.error || 'Failed to fetch organization');
      }
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    }
  }, [id, toast, router]);

  useEffect(() => {
    fetchOrganization();
  }, [id, fetchOrganization]);

  // Handle member invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/organizations/${id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: inviteEmail,
          projectId: selectedProjectId || undefined
        }),
      });

      let responseData;
      try {
        responseData = await res.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        toast({
          title: 'Error',
          description: 'Failed to send invitation',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      if (!res.ok) {
        if (responseData?.error === 'Invitation already sent') {
          toast({
            title: 'Note',
            description: 'An invitation has already been sent to this email address',
            variant: 'default'
          });
        } else {
          toast({
            title: 'Error',
            description: responseData?.error || 'Failed to send invitation',
            variant: 'destructive'
          });
        }
        setInviteEmail('');
        setSelectedProjectId('');
        setIsInviteDialogOpen(false);
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
      
      setInviteEmail('');
      setSelectedProjectId('');
      setIsInviteDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organization Members</h1>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new member to the organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite}>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="project" className="text-sm font-medium">
                      Add to Project (Optional)
                    </label>
                    <select
                      id="project"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">No project</option>
                      {organization?.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organization?.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.user.name}</TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>
                  {/* Add actions like remove member, change role, etc. */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
