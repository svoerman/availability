'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project } from '@prisma/client';
import { FormField, inputClassName } from '@/components/ui/form-field';
import { useOrganizations } from '@/hooks/useOrganizations';

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
  const [sprintStartDay, setSprintStartDay] = useState<number>(initialData?.sprintStartDay || 1);
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ''
  );
  
  const { organizations, organizationId, setOrganizationId, isLoading } = useOrganizations(
    initialData?.organizationId ?? undefined
  );

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
      {!initialData && organizations.length > 1 && (
        <FormField id="organization" label="Organization">
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
        </FormField>
      )}

      <FormField id="name" label="Project Name">
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          required
          autoComplete="off"
        />
      </FormField>

      <FormField id="description" label="Description">
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </FormField>

      <FormField id="startDate" label="Start Date">
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClassName}
          required
        />
      </FormField>

      <FormField id="sprintStartDay" label="Sprint Start Day">
        <select
          id="sprintStartDay"
          value={sprintStartDay}
          onChange={(e) => setSprintStartDay(Number(e.target.value))}
          className={inputClassName}
          required
        >
          {DAYS_OF_WEEK.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </FormField>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
