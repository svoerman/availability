'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: Promise<{
    token: string;
  }>;
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

  // Function to check if we're coming from auth
  const isFromAuth = () => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('from') === 'auth';
  };

  useEffect(() => {
    const fetchInvitation = async () => {
      const resolvedParams = await params;
      try {
        const res = await fetch(`/api/invitations/${resolvedParams.token}`);
        if (!res.ok) throw new Error('Failed to fetch invitation');
        const data = await res.json();
        setInvitation(data);

        // If we're coming from auth and the invitation is valid, accept it automatically
        if (isFromAuth() && data.status === 'PENDING') {
          handleAccept();
        }
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
  }, [params, toast]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const resolvedParams = await params;
    const res = await fetch(`/api/invitations/${resolvedParams.token}/accept`, {
        method: 'POST',
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'Not authenticated') {
          const resolvedParams = await params;
          router.push(`/login?redirect=/invite/${resolvedParams.token}`);
          return;
        }
        
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast({
        title: 'Success',
        description: 'You have successfully joined the organization',
      });

      // Redirect to the organization page using the organization ID from the response
      router.push(`/organizations/${data.organizationId}`);
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
