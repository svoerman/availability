'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project } from '@prisma/client';

interface Organization {
  id: number;
  name: string;
}

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  sprintStartDay: number;
  organizationId: number;
}

interface Props {
  initialData?: Project;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
}

export default function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
  error,
}: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [sprintStartDay, setSprintStartDay] = useState(initialData?.sprintStartDay || 1);
  const [startDate, setStartDate] = useState(
    initialData
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState<number>(
    initialData?.organizationId || 0
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
        // Set organizationId if it's not already set (new project) or if there's only one org
        if (!organizationId || data.length === 1) {
          setOrganizationId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name?.trim()) {
      throw new Error('Project name is required');
    }

    if (!startDate) {
      throw new Error('Start date is required');
    }

    if (!organizationId) {
      throw new Error('Organization is required');
    }

    const sprintStartDayNum = Number(sprintStartDay);
    if (isNaN(sprintStartDayNum) || sprintStartDayNum < 1 || sprintStartDayNum > 7) {
      throw new Error('Please select a valid sprint start day (1-7)');
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      startDate,
      sprintStartDay: sprintStartDayNum,
      organizationId,
    });
  };

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Only show organization selection for new projects with multiple organizations */}
      {!initialData && organizations.length > 1 ? (
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
            Organization
          </label>
          <Select
            value={organizationId.toString()}
            onValueChange={(value) => setOrganizationId(Number(value))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name
        </label>
        <div className="relative">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:bg-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            required
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:bg-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>

      <div>
        <label htmlFor="sprintStartDay" className="block text-sm font-medium text-gray-700">
          Sprint Start Day
        </label>
        <select
          id="sprintStartDay"
          value={sprintStartDay}
          onChange={(e) => setSprintStartDay(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:bg-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          {DAYS_OF_WEEK.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
