import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { UserRole } from "@prisma/client";

async function getOrganization(id: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { 
      id: Number(id),
      members: {
        some: {
          userId: Number(userId)
        }
      }
    },
    include: {
      members: {
        include: {
          user: true
        }
      },
      projects: true
    }
  });

  if (!organization) {
    notFound();
  }

  // Check if user is admin or owner
  const userRole = organization.members.find(m => m.user.id === Number(userId))?.role;
  const canManageSettings = userRole === UserRole.ADMIN || userRole === UserRole.OWNER;

  return {
    ...organization,
    canManageSettings
  };
}

export default async function OrganizationPage({
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
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          {organization.description && (
            <p className="text-muted-foreground mt-2">{organization.description}</p>
          )}
        </div>
        <div className="space-x-4">
          <Button variant="outline" asChild>
            <Link href="/organizations">Back to Organizations</Link>
          </Button>
          {organization.canManageSettings && (
            <Button asChild>
              <Link href={`/organizations/${organization.id}/settings`}>Settings</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Members</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/organizations/${organization.id}/members`}>
                  Manage Members
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Projects</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/organizations/${organization.id}/projects/new`}>
                  New Project
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>View</Link>
                  </Button>
                </div>
              ))}

              {organization.projects.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No projects yet. Create one to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
