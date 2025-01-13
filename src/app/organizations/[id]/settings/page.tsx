import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { OrganizationSettingsForm } from "./organization-settings-form";
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
      id: Number(id)
    },
    include: {
      members: {
        where: {
          userId: Number(userId),
          role: { in: [UserRole.ADMIN, UserRole.OWNER] }
        },
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
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const organization = await getOrganization(params.id, session.user.id);

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

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Destructive actions that cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                <div>
                  <h3 className="font-medium">Delete Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this organization and all of its data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Organization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
