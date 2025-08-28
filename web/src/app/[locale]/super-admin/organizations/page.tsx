'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { toast } from 'sonner';
import { Trash2, Users, FileText, Settings, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import OrganizationAnalyticsDashboard from '@/components/OrganizationAnalyticsDashboard';
import OrganizationDetails from '@/components/OrganizationDetails';

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

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/super-admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      } else {
        toast.error('Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (organizationId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(organizationId)) {
      newExpandedRows.delete(organizationId);
    } else {
      newExpandedRows.add(organizationId);
    }
    setExpandedRows(newExpandedRows);
  };

  const createOrganization = async () => {
    if (!newOrg.name) {
      toast.error('Organization name is required');
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
        toast.success('Organization created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const deleteOrganization = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/organizations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrganizations(organizations.filter(org => org.id !== id));
        toast.success('Organization deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      free: { variant: 'secondary' as const, text: 'Free' },
      basic: { variant: 'default' as const, text: 'Basic' },
      premium: { variant: 'outline' as const, text: 'Premium', className: 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' },
      enterprise: { variant: 'destructive' as const, text: 'Enterprise' },
    };
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
    return <Badge variant={config.variant} className={(config as any).className}>{config.text}</Badge>;
  };



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage all organizations in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Organization</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={newOrg.domain}
                    onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                    placeholder="Enter custom domain (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={newOrg.tier} onValueChange={(value: any) => setNewOrg({ ...newOrg, tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createOrganization} disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Organization'}
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
          <CardTitle>All Organizations ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No organizations found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <>
                    <TableRow key={org.id}>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRowExpansion(org.id)}
                        >
                          {expandedRows.has(org.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
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
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? 'default' : 'secondary'}>
                          {org.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRowExpansion(org.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteOrganization(org.id, org.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(org.id) && (
                      <TableRow key={`${org.id}-expanded`}>
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-6 bg-muted/30">
                            <OrganizationDetails organizationId={org.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


