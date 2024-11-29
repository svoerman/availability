'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: number;
  name: string;
  startDate: string;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetch('/api/projects');
    const data = await response.json();
    setProjects(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, startDate }),
    });

    if (response.ok) {
      setName('');
      setStartDate('');
      fetchProjects();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Projects</h1>
      
      <form onSubmit={handleSubmit} className="mb-12 p-6 rounded-lg border border-border bg-background shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 text-foreground">Create New Project</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-2 text-foreground">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            Create Project
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-6 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
            <p className="text-sm mt-2 text-foreground/70">
              Start Date: {new Date(project.startDate).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
