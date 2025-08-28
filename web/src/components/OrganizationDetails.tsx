'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  HardDrive
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

interface OrganizationDetailsProps {
  organizationId: string;
  className?: string;
}

export default function OrganizationDetails({ organizationId, className = '' }: OrganizationDetailsProps) {
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
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
  }, [organizationId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        Loading organization details...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        Failed to load organization details
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{analytics.organization.name}</h3>
          <p className="text-sm text-muted-foreground">
            Created on {formatDate(analytics.organization.createdAt)}
          </p>
        </div>
        <Badge variant={analytics.organization.isActive ? 'default' : 'secondary'}>
          {analytics.organization.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.users}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {analytics.usage.limits.maxUsers} limit
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
                    / {analytics.usage.limits.maxDocuments} limit
                  </div>
                )}
                <Progress value={analytics.usage.percentages.documents} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.questions}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {analytics.usage.limits.maxQuestionsPerMonth} limit
                  </div>
                )}
                <Progress value={analytics.usage.percentages.questions} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(analytics.usage.current.storage)}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {formatBytes(analytics.usage.limits.maxStorageBytes)} limit
                  </div>
                )}
                <Progress value={analytics.usage.percentages.storage} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.userStats.map((stat) => (
                    <div key={stat.role} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{stat.role}</span>
                      <span className="text-sm font-medium">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.documentStats.map((stat) => (
                    <div key={stat.status} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{stat.status}</span>
                      <span className="text-sm font-medium">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Trends (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.trends.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No trend data available
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.trends.map((trend) => (
                    <div key={trend.month} className="border rounded-lg p-4">
                      <div className="font-medium text-sm mb-3">{trend.month}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">User Registrations</div>
                          <div className="font-medium">{trend.userRegistrations}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Document Uploads</div>
                          <div className="font-medium">{trend.documentUploads}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Questions Asked</div>
                          <div className="font-medium">{trend.questionsAsked}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Admin Actions</div>
                          <div className="font-medium">{trend.adminActions}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Storage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(analytics.storage.totalSize)}</div>
                    <div className="text-xs text-muted-foreground">Total Storage Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.storage.documentCount}</div>
                    <div className="text-xs text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatBytes(analytics.storage.averageSize)}</div>
                    <div className="text-xs text-muted-foreground">Average Document Size</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{activity.action.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground">
                          by {activity.user.name || activity.user.email}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Organization Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <div className="font-medium">{analytics.organization.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Slug</Label>
                  <div className="font-medium">/{analytics.organization.slug}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tier</Label>
                  <div className="font-medium capitalize">{analytics.organization.tier}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <div className="font-medium">{formatDate(analytics.organization.createdAt)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: analytics.organization.primaryColor || '#2563eb' }}
                    />
                    <span className="font-medium">{analytics.organization.primaryColor || '#2563eb'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Logo URL</Label>
                  <div className="font-medium">
                    {analytics.organization.logoUrl ? (
                      <a href={analytics.organization.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Logo
                      </a>
                    ) : (
                      'No logo set'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
