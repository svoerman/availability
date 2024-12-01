'use client';

import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'; // Added import statement for Button component

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
  submitText?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "425px",
  submitText,
  loading,
  error,
  success
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" style={{ maxWidth }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        {children}
        {submitText && (
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : submitText}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
