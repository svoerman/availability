import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

async function getOrganization(id: string, userId: string) {
  console.log('Layout - Getting organization:', { id, userId });
  
  // First check if organization exists
  const organization = await prisma.organization.findUnique({
    where: { 
      id: Number(id)
    },
    include: {
      members: {
        where: {
          userId: Number(userId)
        }
      }
    }
  });

  console.log('Layout - Organization found:', organization);
  console.log('Layout - Members:', organization?.members);

  if (!organization || organization.members.length === 0) {
    notFound();
  }

  return organization;
}

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  console.log('Layout - Starting with params:', params);
  
  const session = await auth();
  console.log('Layout - Session:', { userId: session?.user?.id });
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify user has access to this organization
  await getOrganization(params.id, session.user.id);

  return <>{children}</>;
}
