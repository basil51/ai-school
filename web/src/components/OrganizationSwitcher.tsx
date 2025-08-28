'use client';

import { useState, useEffect } from 'react';
//import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/useTranslations';

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  _count?: {
    users: number;
    documents: number;
  };
  isActive: boolean;
}

interface OrganizationSwitcherProps {
  currentOrgId?: string | null;
  onOrganizationChange?: (orgId: string | null) => void;
  compact?: boolean;
}

export default function OrganizationSwitcher({ 
  currentOrgId, 
  onOrganizationChange,
  compact = false 
}: OrganizationSwitcherProps) {
  const { dict } = useTranslations();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (currentOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === currentOrgId);
      setCurrentOrg(org || null);
    } else {
      setCurrentOrg(null);
    }
  }, [currentOrgId, organizations]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/super-admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.filter((org: Organization) => org.isActive));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (value: string) => {
    const orgId = value === 'system' ? null : value;
    setCurrentOrg(orgId ? organizations.find(o => o.id === orgId) || null : null);
    
    if (onOrganizationChange) {
      onOrganizationChange(orgId);
    }

    // Update URL to reflect organization context
    if (orgId) {
      // Navigate to organization-specific admin
      router.push(`/admin?org=${orgId}`);
    } else {
      // Navigate to system-wide admin
      router.push('/super-admin/organizations');
    }
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      free: { variant: 'secondary' as const, text: dict?.organizationSwitcher?.tiers?.free || 'Free' },
      basic: { variant: 'default' as const, text: dict?.organizationSwitcher?.tiers?.basic || 'Basic' },
      premium: { variant: 'default' as const, text: dict?.organizationSwitcher?.tiers?.premium || 'Premium' },
      enterprise: { variant: 'destructive' as const, text: dict?.organizationSwitcher?.tiers?.enterprise || 'Enterprise' },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">{dict?.organizationSwitcher?.loading || "Loading..."}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <Select 
        value={currentOrgId || 'system'} 
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder={dict?.organizationSwitcher?.selectOrganization || "Select organization"} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <span className="font-medium">{dict?.organizationSwitcher?.systemAdmin || "System Admin"}</span>
              <Badge variant="destructive" className="text-xs">{dict?.organizationSwitcher?.super || "Super"}</Badge>
            </div>
          </SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{org.name}</span>
                {getTierBadge(org.tier)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{dict?.organizationSwitcher?.organizationContext || "Organization Context"}</h3>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Select 
          value={currentOrgId || 'system'} 
          onValueChange={handleOrganizationChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={dict?.organizationSwitcher?.selectOrganization || "Select organization"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{dict?.organizationSwitcher?.systemAdministration || "System Administration"}</div>
                  <div className="text-xs text-muted-foreground">{dict?.organizationSwitcher?.manageAllOrganizations || "Manage all organizations"}</div>
                </div>
                <Badge variant="destructive" className="text-xs">{dict?.organizationSwitcher?.super || "Super"}</Badge>
              </div>
            </SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground">/{org.slug}</div>
                    {org._count && (
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {org._count.users}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {org._count.documents}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    {getTierBadge(org.tier)}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentOrg && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{currentOrg.name}</div>
                <div className="text-xs text-muted-foreground">
                  {dict?.organizationSwitcher?.currentlyManaging || "Currently managing this organization"}
                </div>
              </div>
              {getTierBadge(currentOrg.tier)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
