import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

async function getOrganization(id: string, userId: string) {
  if (!id) {
    console.error('Layout - Invalid organization ID');
    return null;
  }

  try {
    // First check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { 
        id,
        members: {
          some: {
            userId
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

    if (!organization) {
      console.error('Layout - Organization not found or user not a member:', { id, userId });
      return null;
    }

    return organization;
  } catch (error) {
    console.error('Layout - Error fetching organization:', error);
    return null;
  }
}

export default async function OrganizationLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await paramsPromise;
  
  // Verify user has access to this organization
  const organization = await getOrganization(params.id, session.user.id);
  if (!organization) {
    notFound();
  }

  return <>{children}</>;
}
