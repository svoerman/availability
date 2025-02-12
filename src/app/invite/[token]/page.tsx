'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: {
    token: string;
  };
};

type InvitationDetails = {
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    name: string;
  };
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
};

export default function InvitationPage({ params }: Props) {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${params.token}`);
        if (!res.ok) throw new Error('Failed to fetch invitation');
        const data = await res.json();
        setInvitation(data);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invitation details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [params.token, toast]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invitations/${params.token}/accept`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to accept invitation');

      toast({
        title: 'Success',
        description: 'You have successfully joined the organization',
      });

      // Redirect to the organization page
      router.push(`/organizations/${invitation?.organization.id}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[420px]">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitation.status !== 'PENDING') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[420px]">
          <CardHeader>
            <CardTitle>Invitation {invitation.status.toLowerCase()}</CardTitle>
            <CardDescription>
              This invitation has already been {invitation.status.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Organization</p>
            <p className="text-lg">{invitation.organization.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Invited by</p>
            <p className="text-lg">{invitation.inviter.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-lg">{invitation.email}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
