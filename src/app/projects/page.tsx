import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/db';
import NewProjectButton from '@/components/NewProjectButton';

export default async function Projects() {
  const projects = await prisma.project.findMany({
    include: {
      members: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <NewProjectButton />
        </div>
        <div className="grid gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-gradient-to-tr from-indigo-100 to-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                  {project.description && (
                    <p className="text-gray-600 mb-4">{project.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mb-4">
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
                    {project.members.map((member) => (
                      <span
                        key={member.id}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
