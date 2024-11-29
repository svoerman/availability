import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Details',
  description: 'View and edit project details',
};

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-6">
      {children}
    </div>
  );
}
