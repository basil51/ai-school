'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  HardDrive,
  Download
} from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';
import RealTimeActivityFeed from './RealTimeActivityFeed';
import PredictiveAnalytics from './PredictiveAnalytics';
import AnalyticsFilters, { FilterState } from './AnalyticsFilters';
import ScheduledReports from './ScheduledReports';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const { dict } = useTranslations();
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    metrics: ['users', 'documents', 'questions', 'storage'],
    userRoles: ['student', 'teacher', 'admin', 'guardian'],
    activityTypes: ['user_login', 'document_uploaded', 'question_asked', 'settings_updated'],
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error(dict?.organizationDetails?.failedToLoad || 'Failed to fetch organization analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(dict?.organizationDetails?.failedToLoad || 'Failed to fetch organization analytics');
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

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['Organization Analytics Report'],
      ['Organization:', analytics.organization.name],
      ['Generated:', new Date().toLocaleDateString()],
      [],
      ['Usage Statistics'],
      ['Metric', 'Current', 'Limit', 'Percentage'],
      ['Users', analytics.usage.current.users, analytics.usage.limits?.maxUsers || 'N/A', `${analytics.usage.percentages.users}%`],
      ['Documents', analytics.usage.current.documents, analytics.usage.limits?.maxDocuments || 'N/A', `${analytics.usage.percentages.documents}%`],
      ['Questions', analytics.usage.current.questions, analytics.usage.limits?.maxQuestionsPerMonth || 'N/A', `${analytics.usage.percentages.questions}%`],
      ['Storage', formatBytes(analytics.usage.current.storage), analytics.usage.limits ? formatBytes(analytics.usage.limits.maxStorageBytes) : 'N/A', `${analytics.usage.percentages.storage}%`],
      [],
      ['User Distribution'],
      ['Role', 'Count'],
      ...analytics.userStats.map(stat => [stat.role, stat.count]),
      [],
      ['Document Status'],
      ['Status', 'Count'],
      ...analytics.documentStats.map(stat => [stat.status, stat.count]),
      [],
      ['Monthly Trends'],
      ['Month', 'User Registrations', 'Document Uploads', 'Questions Asked', 'Admin Actions'],
      ...analytics.trends.map(trend => [
        trend.month,
        trend.userRegistrations,
        trend.documentUploads,
        trend.questionsAsked,
        trend.adminActions
      ]),
      [],
      ['Storage Analytics'],
      ['Metric', 'Value'],
      ['Total Storage', formatBytes(analytics.storage.totalSize)],
      ['Document Count', analytics.storage.documentCount],
      ['Average Document Size', formatBytes(analytics.storage.averageSize)]
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${analytics.organization.name}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Organization Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Organization Info
    doc.setFontSize(12);
    doc.text(`Organization: ${analytics.organization.name}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Usage Statistics
    doc.setFontSize(14);
    doc.text('Usage Statistics', margin, yPosition);
    yPosition += 10;

    const usageData = [
      ['Metric', 'Current', 'Limit', 'Percentage'],
      ['Users', analytics.usage.current.users.toString(), analytics.usage.limits?.maxUsers.toString() || 'N/A', `${analytics.usage.percentages.users}%`],
      ['Documents', analytics.usage.current.documents.toString(), analytics.usage.limits?.maxDocuments.toString() || 'N/A', `${analytics.usage.percentages.documents}%`],
      ['Questions', analytics.usage.current.questions.toString(), analytics.usage.limits?.maxQuestionsPerMonth.toString() || 'N/A', `${analytics.usage.percentages.questions}%`],
      ['Storage', formatBytes(analytics.usage.current.storage), analytics.usage.limits ? formatBytes(analytics.usage.limits.maxStorageBytes) : 'N/A', `${analytics.usage.percentages.storage}%`]
    ];

    autoTable(doc, {
      head: [usageData[0]],
      body: usageData.slice(1),
      startY: yPosition,
      margin: { left: margin },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // User Distribution
    doc.setFontSize(14);
    doc.text('User Distribution', margin, yPosition);
    yPosition += 10;

    const userData = analytics.userStats.map(stat => [stat.role, stat.count.toString()]);
    autoTable(doc, {
      head: [['Role', 'Count']],
      body: userData,
      startY: yPosition,
      margin: { left: margin },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Document Status
    doc.setFontSize(14);
    doc.text('Document Status', margin, yPosition);
    yPosition += 10;

    const docData = analytics.documentStats.map(stat => [stat.status, stat.count.toString()]);
    autoTable(doc, {
      head: [['Status', 'Count']],
      body: docData,
      startY: yPosition,
      margin: { left: margin },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Monthly Trends
    doc.setFontSize(14);
    doc.text('Monthly Trends', margin, yPosition);
    yPosition += 10;

    const trendsData = analytics.trends.map(trend => [
      trend.month,
      trend.userRegistrations.toString(),
      trend.documentUploads.toString(),
      trend.questionsAsked.toString(),
      trend.adminActions.toString()
    ]);

    autoTable(doc, {
      head: [['Month', 'User Registrations', 'Document Uploads', 'Questions Asked', 'Admin Actions']],
      body: trendsData,
      startY: yPosition,
      margin: { left: margin },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Storage Analytics
    doc.setFontSize(14);
    doc.text('Storage Analytics', margin, yPosition);
    yPosition += 10;

    const storageData = [
      ['Total Storage', formatBytes(analytics.storage.totalSize)],
      ['Document Count', analytics.storage.documentCount.toString()],
      ['Average Document Size', formatBytes(analytics.storage.averageSize)]
    ];

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: storageData,
      startY: yPosition,
      margin: { left: margin },
      styles: { fontSize: 10 }
    });

    doc.save(`${analytics.organization.name}_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        {dict?.organizationDetails?.loading || "Loading organization details..."}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        {dict?.organizationDetails?.failedToLoad || "Failed to load organization details"}
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
        <div className="flex items-center gap-2">
          <Badge variant={analytics.organization.isActive ? 'default' : 'secondary'}>
            {analytics.organization.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <AnalyticsFilters onFiltersChange={setFilters} className="mb-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{dict?.organizationDetails?.overview || "Overview"}</TabsTrigger>
          <TabsTrigger value="analytics">{dict?.organizationDetails?.analytics || "Analytics"}</TabsTrigger>
          <TabsTrigger value="predictive">{dict?.organizationDetails?.predictive || "Predictive"}</TabsTrigger>
          <TabsTrigger value="activity">{dict?.organizationDetails?.activity || "Activity"}</TabsTrigger>
          <TabsTrigger value="reports">{dict?.organizationDetails?.reports || "Reports"}</TabsTrigger>
          <TabsTrigger value="settings">{dict?.organizationDetails?.settings || "Settings"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.users || "Users"}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.users}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {analytics.usage.limits.maxUsers} {dict?.organizationDetails?.limit || "limit"}
                  </div>
                )}
                <Progress value={analytics.usage.percentages.users} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.documents || "Documents"}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.documents}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {analytics.usage.limits.maxDocuments} {dict?.organizationDetails?.limit || "limit"}
                  </div>
                )}
                <Progress value={analytics.usage.percentages.documents} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.questions || "Questions"}</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.usage.current.questions}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {analytics.usage.limits.maxQuestionsPerMonth} {dict?.organizationDetails?.limit || "limit"}
                  </div>
                )}
                <Progress value={analytics.usage.percentages.questions} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.storage || "Storage"}</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(analytics.usage.current.storage)}</div>
                {analytics.usage.limits && (
                  <div className="text-xs text-muted-foreground">
                    / {formatBytes(analytics.usage.limits.maxStorageBytes)} {dict?.organizationDetails?.limit || "limit"}
                  </div>
                )}
                <Progress value={analytics.usage.percentages.storage} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.userDistribution || "User Distribution"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.userStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {analytics.userStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 50%)`} />
                      ))}
                      <RechartsTooltip />
                      <RechartsLegend />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.documentStatus || "Document Status"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.documentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Bar dataKey="count" fill="#8884d8" />
                    <RechartsTooltip />
                    <RechartsLegend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.monthlyTrends || "Monthly Trends (Last 6 Months)"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line type="monotone" dataKey="userRegistrations" stroke="#8884d8" />
                  <Line type="monotone" dataKey="documentUploads" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="questionsAsked" stroke="#ffc658" />
                  <Line type="monotone" dataKey="adminActions" stroke="#ff8042" />
                  <RechartsTooltip />
                  <RechartsLegend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.storageAnalytics || "Storage Analytics"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[{ name: 'Total Storage', value: analytics.storage.totalSize }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#8884d8" />
                  <RechartsTooltip />
                  <RechartsLegend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveAnalytics organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RealTimeActivityFeed organizationId={organizationId} filters={filters} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ScheduledReports organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.organizationInfo || "Organization Info"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.name || "Name"}</Label>
                  <div className="font-medium">{analytics.organization.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.slug || "Slug"}</Label>
                  <div className="font-medium">/{analytics.organization.slug}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.tier || "Tier"}</Label>
                  <div className="font-medium capitalize">{analytics.organization.tier}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.created || "Created"}</Label>
                  <div className="font-medium">{formatDate(analytics.organization.createdAt)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{dict?.organizationDetails?.branding || "Branding"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.primaryColor || "Primary Color"}</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: analytics.organization.primaryColor || '#2563eb' }}
                    />
                    <span className="font-medium">{analytics.organization.primaryColor || '#2563eb'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{dict?.organizationDetails?.logoUrl || "Logo URL"}</Label>
                  <div className="font-medium">
                    {analytics.organization.logoUrl ? (
                      <a href={analytics.organization.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {dict?.organizationDetails?.viewLogo || "View Logo"}
                      </a>
                    ) : (
                      dict?.organizationDetails?.noLogoSet || 'No logo set'
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
