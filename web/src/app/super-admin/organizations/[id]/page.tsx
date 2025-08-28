'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  HardDrive, 
  TrendingUp, 
  Settings, 
  Palette,
  Activity,
  Calendar,
  BarChart3,
  Globe,
  Shield
} from 'lucide-react';

interface OrganizationAnalytics {
  organization: {
    id: string;
    name: string;
    slug: string;
    tier: 'free' | 'basic' | 'premium' | 'enterprise';
    isActive: boolean;
    createdAt: string;
    primaryColor?: string;
    logoUrl?: string;
  };
  usage: {
    current: {
      users: number;
      documents: number;
      questions: number;
      storage: number;
    };
    limits: {
      maxUsers: number;
      maxDocuments: number;
      maxQuestionsPerMonth: number;
      maxStorageBytes: number;
    } | null;
    percentages: {
      users: number;
      documents: number;
      questions: number;
      storage: number;
    };
  };
  userStats: Array<{
    role: string;
    count: number;
  }>;
  documentStats: Array<{
    status: string;
    count: number;
  }>;
  storage: {
    totalSize: number;
    documentCount: number;
    averageSize: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details: any;
    createdAt: string;
    user: {
      name?: string;
      email: string;
    };
  }>;
  trends: Array<{
    month: string;
    userRegistrations: number;
    documentUploads: number;
    questionsAsked: number;
    adminActions: number;
  }>;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const organizationId = params.id as string;
  
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [organizationId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to fetch organization analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch organization analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading organization analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load organization data
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{analytics.organization.name}</h1>
          <p className="text-muted-foreground">
            Organization ID: {analytics.organization.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getTierBadge(analytics.organization.tier)}
          <Badge variant={analytics.organization.isActive ? 'default' : 'secondary'}>
            {analytics.organization.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.users}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    of {analytics.usage.limits.maxUsers} max
                  </div>
                )}
                <Progress value={analytics.usage.percentages.users} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.documents}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    of {analytics.usage.limits.maxDocuments} max
                  </div>
                )}
                <Progress value={analytics.usage.percentages.documents} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questions (Monthly)</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.questions}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    of {analytics.usage.limits.maxQuestionsPerMonth} max
                  </div>
                )}
                <Progress value={analytics.usage.percentages.questions} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(analytics.usage.current.storage)}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    of {formatBytes(analytics.usage.limits.maxStorageBytes)} max
                  </div>
                )}
                <Progress value={analytics.usage.percentages.storage} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.userStats.map((stat) => (
                  <div key={stat.role} className="text-center">
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{stat.role}s</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.documentStats.map((stat) => (
                  <div key={stat.status} className="text-center">
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{stat.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trends.map((trend) => (
                  <div key={trend.month} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{trend.month}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{trend.userRegistrations}</div>
                        <div className="text-muted-foreground">New Users</div>
                      </div>
                      <div>
                        <div className="font-medium">{trend.documentUploads}</div>
                        <div className="text-muted-foreground">Documents</div>
                      </div>
                      <div>
                        <div className="font-medium">{trend.questionsAsked}</div>
                        <div className="text-muted-foreground">Questions</div>
                      </div>
                      <div>
                        <div className="font-medium">{trend.adminActions}</div>
                        <div className="text-muted-foreground">Admin Actions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatBytes(analytics.storage.totalSize)}</div>
                  <div className="text-sm text-muted-foreground">Total Storage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.storage.documentCount}</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatBytes(analytics.storage.averageSize)}</div>
                  <div className="text-sm text-muted-foreground">Avg. Document Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {activity.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.user.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{activity.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify(activity.details)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(activity.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organization Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input value={analytics.organization.name} readOnly />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={analytics.organization.slug} readOnly />
                </div>
                <div>
                  <Label>Created</Label>
                  <Input value={formatDate(analytics.organization.createdAt)} readOnly />
                </div>
                <div>
                  <Label>Tier</Label>
                  <div className="mt-2">{getTierBadge(analytics.organization.tier)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: analytics.organization.primaryColor || '#2563eb' }}
                    />
                    <Input 
                      value={analytics.organization.primaryColor || '#2563eb'} 
                      readOnly 
                    />
                  </div>
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={analytics.organization.logoUrl || 'Not set'} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
