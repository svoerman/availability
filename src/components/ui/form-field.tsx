'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        {children}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export const inputClassName = "block w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:bg-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
