"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface UseOrganizationReturn {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

export function useOrganization(): UseOrganizationReturn {
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/organization');
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization data');
        }
        
        const data = await response.json();
        setOrganization(data.organization);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [session?.user?.email]);

  return { organization, loading, error };
}
