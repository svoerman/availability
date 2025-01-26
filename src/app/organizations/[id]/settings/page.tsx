import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { DeleteOrganization } from "./delete-organization";
import { UserRole } from "@prisma/client";
import { type Organization, type User } from "@prisma/client";

interface OrganizationWithMembers extends Organization {
  members: Array<{
    user: User;
    role: UserRole;
  }>;
}

async function getOrganization(id: string, userId: string): Promise<OrganizationWithMembers> {
  const organization = await prisma.organization.findUnique({
    where: { 
      id,
      members: {
        some: {
          userId,
          role: { in: [UserRole.ADMIN, UserRole.OWNER] }
        }
      }
    },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!organization || organization.members.length === 0) {
    notFound();
  }

  return organization;
}

export default async function OrganizationSettingsPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await paramsPromise;
  const organization = await getOrganization(params.id, session.user.id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization settings and preferences
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/organizations/${organization.id}`}>
            Back to Organization
          </Link>
        </Button>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Update your organization&apos;s basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSettingsForm organization={organization} />
          </CardContent>
        </Card>

        {organization.members.some(m => m.role === UserRole.OWNER) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Destructive actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DeleteOrganization organization={organization} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
