'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { Trash2, Users, FileText, ExternalLink, BarChart3 } from 'lucide-react';
import OrganizationAnalyticsDashboard from '@/components/OrganizationAnalyticsDashboard';
import OrganizationDetails from '@/components/OrganizationDetails';
import { useTranslations } from '@/lib/useTranslations';
//import { useParams } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  domain?: string;
  isActive: boolean;
  primaryColor?: string;
  createdAt: string;
  _count: {
    users: number;
    documents: number;
  };
  settings?: {
    maxUsers: number;
    maxDocuments: number;
    maxQuestionsPerMonth: number;
  };
}



export default function SuperAdminOrganizationsPage() {
  const { dict } = useTranslations();
  const router = useRouter();
  //const params = useParams();
  //const locale = params.locale as string;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [newOrg, setNewOrg] = useState({
    name: '',
    description: '',
    domain: '',
    tier: 'free' as const,
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      } else {
        toast.error(dict?.superAdmin?.failedToFetch || 'Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error(dict?.superAdmin?.failedToFetch || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, [dict]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const toggleRowExpansion = (organizationId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(organizationId)) {
      newExpandedRows.delete(organizationId);
    } else {
      newExpandedRows.add(organizationId);
    }
    setExpandedRows(newExpandedRows);
  };

  const redirectToAdmin = (organizationId: string) => {
    router.push(`/admin?org=${organizationId}`);
  };

  const createOrganization = async () => {
    if (!newOrg.name) {
      toast.error(dict?.superAdmin?.organizationNameRequired || 'Organization name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/super-admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrg),
      });

      if (response.ok) {
        const organization = await response.json();
        setOrganizations([organization, ...organizations]);
        setNewOrg({ name: '', description: '', domain: '', tier: 'free' });
        setIsDialogOpen(false);
        toast.success(dict?.superAdmin?.organizationCreated || 'Organization created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || (dict?.superAdmin?.failedToCreate || 'Failed to create organization'));
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error(dict?.superAdmin?.failedToCreate || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const deleteOrganization = async (id: string, name: string) => {
    const confirmMessage = (dict?.superAdmin?.confirmDelete || 'Are you sure you want to delete "{name}"? This action cannot be undone.').replace('{name}', name);
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/organizations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrganizations(organizations.filter(org => org.id !== id));
        toast.success(dict?.superAdmin?.organizationDeleted || 'Organization deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || (dict?.superAdmin?.failedToDelete || 'Failed to delete organization'));
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(dict?.superAdmin?.failedToDelete || 'Failed to delete organization');
    }
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      free: { variant: 'secondary' as const, text: dict?.superAdmin?.tiers?.free || 'Free' },
      basic: { variant: 'default' as const, text: dict?.superAdmin?.tiers?.basic || 'Basic' },
      premium: { variant: 'outline' as const, text: dict?.superAdmin?.tiers?.premium || 'Premium', className: 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' },
      enterprise: { variant: 'destructive' as const, text: dict?.superAdmin?.tiers?.enterprise || 'Enterprise' },
    };
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
    return <Badge variant={config.variant} className={(config as any).className}>{config.text}</Badge>;
  };



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">{dict?.superAdmin?.loadingOrganizations || "Loading organizations..."}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{dict?.superAdmin?.organizations || "Organizations"}</h1>
          <p className="text-muted-foreground">{dict?.superAdmin?.organizationsDescription || "Manage all organizations in the system"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showAnalytics ? (dict?.superAdmin?.hideAnalytics || 'Hide Analytics') : (dict?.superAdmin?.showAnalytics || 'Show Analytics')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>{dict?.superAdmin?.createOrganization || "Create Organization"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dict?.superAdmin?.createNewOrganization || "Create New Organization"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{dict?.superAdmin?.organizationName || "Organization Name"}</Label>
                  <Input
                    id="name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder={dict?.superAdmin?.organizationNamePlaceholder || "Enter organization name"}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{dict?.superAdmin?.description || "Description"}</Label>
                  <Input
                    id="description"
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    placeholder={dict?.superAdmin?.descriptionPlaceholder || "Enter description (optional)"}
                  />
                </div>
                <div>
                  <Label htmlFor="domain">{dict?.superAdmin?.customDomain || "Custom Domain"}</Label>
                  <Input
                    id="domain"
                    value={newOrg.domain}
                    onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                    placeholder={dict?.superAdmin?.customDomainPlaceholder || "Enter custom domain (optional)"}
                  />
                </div>
                <div>
                  <Label htmlFor="tier">{dict?.superAdmin?.tier || "Tier"}</Label>
                  <Select value={newOrg.tier} onValueChange={(value: any) => setNewOrg({ ...newOrg, tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{dict?.superAdmin?.tiers?.free || "Free"}</SelectItem>
                      <SelectItem value="basic">{dict?.superAdmin?.tiers?.basic || "Basic"}</SelectItem>
                      <SelectItem value="premium">{dict?.superAdmin?.tiers?.premium || "Premium"}</SelectItem>
                      <SelectItem value="enterprise">{dict?.superAdmin?.tiers?.enterprise || "Enterprise"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createOrganization} disabled={creating} className="w-full">
                  {creating ? (dict?.superAdmin?.creating || 'Creating...') : (dict?.superAdmin?.createOrganizationButton || 'Create Organization')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showAnalytics && (
        <div className="mb-8">
          <OrganizationAnalyticsDashboard />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{dict?.superAdmin?.allOrganizations || "All Organizations"} ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {dict?.superAdmin?.noOrganizationsFound || "No organizations found. Create one to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict?.superAdmin?.organization || "Organization"}</TableHead>
                  <TableHead>{dict?.superAdmin?.tier || "Tier"}</TableHead>
                  <TableHead>{dict?.superAdmin?.users || "Users"}</TableHead>
                  <TableHead>{dict?.superAdmin?.documents || "Documents"}</TableHead>
                  <TableHead>{dict?.superAdmin?.domain || "Domain"}</TableHead>
                  <TableHead>{dict?.superAdmin?.status || "Status"}</TableHead>
                  <TableHead>{dict?.superAdmin?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <React.Fragment key={org.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRowExpansion(org.id)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">/{org.slug}</div>
                          {org.description && (
                            <div className="text-xs text-muted-foreground">{org.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(org.tier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {org._count?.users || 0}
                          {org.settings && (
                            <span className="text-xs text-muted-foreground">
                              /{org.settings.maxUsers}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {org._count?.documents || 0}
                          {org.settings && (
                            <span className="text-xs text-muted-foreground">
                              /{org.settings.maxDocuments}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.domain ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {org.domain}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-sm">{dict?.superAdmin?.none || "None"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? 'default' : 'secondary'}>
                          {org.isActive ? (dict?.superAdmin?.active || 'Active') : (dict?.superAdmin?.inactive || 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              redirectToAdmin(org.id);
                            }}
                            title={dict?.superAdmin?.goToAdmin || "Go to Admin"}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOrganization(org.id, org.name);
                            }}
                            title={dict?.superAdmin?.delete || "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(org.id) && (
                      <TableRow key={`${org.id}-expanded`}>
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-6 bg-muted/30">
                            <OrganizationDetails organizationId={org.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


