import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { redirect } from "next/navigation";

async function getOrganizations(userId: string) {
  return await prisma.organization.findMany({
    where: { 
      members: {
        some: {
          userId: userId
        }
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        select: {
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export default async function OrganizationsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Store session user for use in the component
  const sessionUser = session.user;
  const organizations = await getOrganizations(sessionUser.id);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <CreateOrganizationDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>{org.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {org.members.length} member{org.members.length === 1 ? '' : 's'}
                </div>
                {/* Only show link if user has a role in the organization */}
                {org.members.some(member => 
                  member.userId === sessionUser.id
                ) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <a href={`/organizations/${org.id}`}>View Details</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {organizations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No organizations found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
