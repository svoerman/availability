import { useState, useEffect } from 'react';

interface Organization {
  id: string;
  name: string;
}

export function useOrganizations(initialOrgId: string | null | undefined) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(initialOrgId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
        if (!organizationId || data.length === 1) {
          setOrganizationId(data[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch organizations';
        setError(message);
        console.error('Failed to fetch organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [organizationId]);

  return { organizations, organizationId, setOrganizationId, isLoading, error };
}
