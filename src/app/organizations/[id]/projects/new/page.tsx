import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Metadata } from "next";
import NewOrganizationProjectForm from "./new-organization-project-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "New Project",
  description: "Create a new project in your organization",
};

interface Props {
  params: {
    id: string;
  };
}

export default async function NewProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: Number(params.id) },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  // Check if user is member with ADMIN or OWNER role
  const member = organization.members[0];
  if (!member || ![UserRole.ADMIN, UserRole.OWNER].includes(member.role)) {
    redirect(`/organizations/${params.id}`);
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Create a new project in {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewOrganizationProjectForm organization={organization} />
        </CardContent>
      </Card>
    </div>
  );
}
