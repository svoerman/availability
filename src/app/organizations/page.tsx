'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface Organization {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function OrganizationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    fetchOrganizations();
  }, [session, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      setOrganizations(data);
      
      // If user has no organizations, open the create dialog automatically
      if (data.length === 0) {
        setIsOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations: ' + error,
        variant: 'destructive',
      });
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });

      if (!response.ok) throw new Error('Failed to create organization');
      
      setIsOpen(false);
      setNewOrg({ name: '', description: '' });
      fetchOrganizations();
      
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create organization: ' + error,
        variant: 'destructive',
      });
    }
  };

  const handleOrgClick = (orgId: number) => {
    router.replace(`/projects?org=${orgId}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Organizations</h1>
        <Dialog open={isOpen} onOpenChange={(open) => {
          // Only allow closing the dialog if the user has at least one organization
          if (!open && organizations.length === 0) {
            toast({
              title: 'Create Organization Required',
              description: 'You must create an organization to continue.',
              variant: 'destructive',
            });
            return;
          }
          setIsOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>Create Organization</Button>
          </DialogTrigger>
          <DialogContent aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div id="dialog-description" className="text-sm text-muted-foreground mb-4">
              Create a new organization to manage your projects and team members.
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <Card
            key={org.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleOrgClick(org.id)}
          >
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>
                Created {new Date(org.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {org.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
