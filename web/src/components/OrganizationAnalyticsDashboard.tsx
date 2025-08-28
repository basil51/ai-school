'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  HardDrive, 
  TrendingUp, 
  Building2,
  Activity,
  BarChart3
} from 'lucide-react';

interface SystemAnalytics {
  totalOrganizations: number;
  totalUsers: number;
  totalDocuments: number;
  totalQuestions: number;
  totalStorage: number;
  activeOrganizations: number;
  tierDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    tier: string;
    userCount: number;
    documentCount: number;
    questionCount: number;
    storageUsed: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    organizationName: string;
    userEmail: string;
    createdAt: string;
  }>;
  monthlyGrowth: Array<{
    month: string;
    newOrganizations: number;
    newUsers: number;
    newDocuments: number;
    questionsAsked: number;
  }>;
}

export default function OrganizationAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemAnalytics();
  }, []);

  const fetchSystemAnalytics = async () => {
    try {
      const response = await fetch('/api/super-admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch system analytics');
      }
    } catch (error) {
      console.error('Error fetching system analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading system analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Failed to load system analytics
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalOrganizations)}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.activeOrganizations} active
            </div>
            <Progress 
              value={(analytics.activeOrganizations / analytics.totalOrganizations) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</div>
            <div className="text-xs text-muted-foreground">
              Across all organizations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalDocuments)}</div>
            <div className="text-xs text-muted-foreground">
              Uploaded and processed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalQuestions)}</div>
            <div className="text-xs text-muted-foreground">
              Asked this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution and Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Organization Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.tierDistribution.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierBadge(tier.tier)}
                    <span className="text-sm font-medium">{tier.count} orgs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={tier.percentage} className="w-20" />
                    <span className="text-sm text-muted-foreground">{tier.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              System Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatBytes(analytics.totalStorage)}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Total storage used across all organizations
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Organizations by Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Storage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTierBadge(org.tier)}</TableCell>
                  <TableCell>{org.userCount}</TableCell>
                  <TableCell>{org.documentCount}</TableCell>
                  <TableCell>{org.questionCount}</TableCell>
                  <TableCell>{formatBytes(org.storageUsed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>User</TableHead>
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
                  <TableCell>{activity.organizationName}</TableCell>
                  <TableCell>{activity.userEmail}</TableCell>
                  <TableCell>
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyGrowth.map((month) => (
              <div key={month.month} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{month.month}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{month.newOrganizations}</div>
                    <div className="text-muted-foreground">New Orgs</div>
                  </div>
                  <div>
                    <div className="font-medium">{month.newUsers}</div>
                    <div className="text-muted-foreground">New Users</div>
                  </div>
                  <div>
                    <div className="font-medium">{month.newDocuments}</div>
                    <div className="text-muted-foreground">Documents</div>
                  </div>
                  <div>
                    <div className="font-medium">{month.questionsAsked}</div>
                    <div className="text-muted-foreground">Questions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
