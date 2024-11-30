import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from 'date-fns';
import { prisma } from '@/lib/db';
import NewProjectButton from '@/components/NewProjectButton';
import Link from 'next/link';
import { OrganizationMember } from '@/types/prisma';
import { Project } from '@prisma/client';

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function Projects({ searchParams }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const orgId = params.org ? parseInt(params.org) : null;

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      organizations: {
        select: {
          organizationId: true
        }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  // Verify user has access to the requested organization
  if (orgId && !user.organizations.some((member: OrganizationMember) => member.organizationId === orgId)) {
    redirect("/organizations");
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId: orgId ?? {
        in: user.organizations.map((member: OrganizationMember) => member.organizationId)
      }
    },
    include: {
      members: true,
      organization: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <NewProjectButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project: Project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block"
          >
            <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{project.members.length} members</span>
                <div>
                  Start: {format(new Date(project.startDate), 'd MMM yyyy')}
                </div>
                {project.endDate && (
                  <div>
                    End: {format(new Date(project.endDate), 'd MMM yyyy')}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.members.map((member: OrganizationMember) => (
                  <span
                    key={member.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No projects yet. Create your first project to get started!
        </p>
      )}
    </div>
  );
}
