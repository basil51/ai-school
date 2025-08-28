'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Clock, 
  Plus, 
  Trash2, 
  Edit,
  Play,
  Pause
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from '@/lib/useTranslations';

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  isActive: boolean;
  recipients: string[];
  metrics: string[];
  format: 'pdf' | 'csv' | 'html';
  lastSent?: string;
  nextScheduled?: string;
  createdAt: string;
}

interface ScheduledReportsProps {
  organizationId: string;
  className?: string;
}

export default function ScheduledReports({ organizationId, className = '' }: ScheduledReportsProps) {
  const { dict } = useTranslations();

  const FREQUENCY_OPTIONS = [
    { value: 'daily', label: dict?.scheduledReports?.options?.daily || 'Daily' },
    { value: 'weekly', label: dict?.scheduledReports?.options?.weekly || 'Weekly' },
    { value: 'monthly', label: dict?.scheduledReports?.options?.monthly || 'Monthly' },
  ];

  const DAY_OF_WEEK_OPTIONS = [
    { value: '0', label: dict?.scheduledReports?.options?.sunday || 'Sunday' },
    { value: '1', label: dict?.scheduledReports?.options?.monday || 'Monday' },
    { value: '2', label: dict?.scheduledReports?.options?.tuesday || 'Tuesday' },
    { value: '3', label: dict?.scheduledReports?.options?.wednesday || 'Wednesday' },
    { value: '4', label: dict?.scheduledReports?.options?.thursday || 'Thursday' },
    { value: '5', label: dict?.scheduledReports?.options?.friday || 'Friday' },
    { value: '6', label: dict?.scheduledReports?.options?.saturday || 'Saturday' },
  ];

  const METRIC_OPTIONS = [
    { value: 'users', label: dict?.scheduledReports?.options?.userStatistics || 'User Statistics' },
    { value: 'documents', label: dict?.scheduledReports?.options?.documentAnalytics || 'Document Analytics' },
    { value: 'questions', label: dict?.scheduledReports?.options?.questionActivity || 'Question Activity' },
    { value: 'storage', label: dict?.scheduledReports?.options?.storageUsage || 'Storage Usage' },
    { value: 'activity', label: dict?.scheduledReports?.options?.activityFeed || 'Activity Feed' },
    { value: 'growth', label: dict?.scheduledReports?.options?.growthTrends || 'Growth Trends' },
    { value: 'predictive', label: dict?.scheduledReports?.options?.predictiveAnalytics || 'Predictive Analytics' },
  ];

  const FORMAT_OPTIONS = [
    { value: 'pdf', label: dict?.scheduledReports?.options?.pdfReport || 'PDF Report' },
    { value: 'csv', label: dict?.scheduledReports?.options?.csvData || 'CSV Data' },
    { value: 'html', label: dict?.scheduledReports?.options?.htmlEmail || 'HTML Email' },
  ];

  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [_editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: '',
    description: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '09:00',
    isActive: true,
    recipients: [],
    metrics: ['users', 'documents', 'questions'],
    format: 'pdf',
  });

  const fetchScheduledReports = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        // Generate sample data for demonstration
        const sampleReports: ScheduledReport[] = [
          {
            id: '1',
            name: 'Weekly Analytics Summary',
            description: 'Comprehensive weekly overview of organization metrics',
            frequency: 'weekly',
            dayOfWeek: 1,
            time: '09:00',
            isActive: true,
            recipients: ['admin@example.com', 'manager@example.com'],
            metrics: ['users', 'documents', 'questions', 'growth'],
            format: 'pdf',
            lastSent: '2024-01-15T09:00:00Z',
            nextScheduled: '2024-01-22T09:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'Daily Activity Digest',
            description: 'Daily summary of user activities and system usage',
            frequency: 'daily',
            time: '18:00',
            isActive: false,
            recipients: ['admin@example.com'],
            metrics: ['activity', 'users'],
            format: 'html',
            lastSent: '2024-01-16T18:00:00Z',
            nextScheduled: '2024-01-17T18:00:00Z',
            createdAt: '2024-01-10T00:00:00Z',
          },
        ];
        setReports(sampleReports);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  const createReport = async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });

      if (response.ok) {
        await fetchScheduledReports();
        setIsCreateDialogOpen(false);
        setNewReport({
          name: '',
          description: '',
          frequency: 'weekly',
          dayOfWeek: 1,
          time: '09:00',
          isActive: true,
          recipients: [],
          metrics: ['users', 'documents', 'questions'],
          format: 'pdf',
        });
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const updateReport = async (reportId: string, updates: Partial<ScheduledReport>) => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchScheduledReports();
        setEditingReport(null);
      }
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const toggleReportStatus = async (reportId: string, isActive: boolean) => {
    await updateReport(reportId, { isActive });
  };

  const sendReportNow = async (reportId: string) => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports/${reportId}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error sending report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFrequencyLabel = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${DAY_OF_WEEK_OPTIONS.find(d => d.value === dayOfWeek?.toString())?.label})`;
      case 'monthly':
        return `Monthly (${dayOfMonth}${getDaySuffix(dayOfMonth || 1)})`;
      default:
        return frequency;
    }
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{dict?.scheduledReports?.title || "Scheduled Reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-6 w-6 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{dict?.scheduledReports?.loadingReports || "Loading reports..."}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{dict?.scheduledReports?.title || "Scheduled Reports"}</h2>
          <p className="text-sm text-muted-foreground">
            {dict?.scheduledReports?.description || "Configure automated email reports for analytics data"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {dict?.scheduledReports?.createReport || "Create Report"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{dict?.scheduledReports?.createReport || "Create Scheduled Report"}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="Weekly Analytics Summary"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Brief description of the report"
                  />
                </div>
                <div>
                  <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                  <Input
                    id="recipients"
                    value={newReport.recipients?.join(', ')}
                    onChange={(e) => setNewReport({ 
                      ...newReport, 
                      recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    })}
                    placeholder="admin@example.com, manager@example.com"
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={newReport.frequency} 
                    onValueChange={(value) => setNewReport({ ...newReport, frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newReport.frequency === 'weekly' && (
                  <div>
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select 
                      value={newReport.dayOfWeek?.toString()} 
                      onValueChange={(value) => setNewReport({ ...newReport, dayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OF_WEEK_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newReport.frequency === 'monthly' && (
                  <div>
                    <Label htmlFor="dayOfMonth">Day of Month</Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      value={newReport.dayOfMonth}
                      onChange={(e) => setNewReport({ ...newReport, dayOfMonth: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newReport.time}
                    onChange={(e) => setNewReport({ ...newReport, time: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Metrics to Include</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {METRIC_OPTIONS.map((metric) => (
                      <div key={metric.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric.value}
                          checked={newReport.metrics?.includes(metric.value)}
                          onCheckedChange={(checked) => {
                            const metrics = newReport.metrics || [];
                            if (checked) {
                              setNewReport({ ...newReport, metrics: [...metrics, metric.value] });
                            } else {
                              setNewReport({ ...newReport, metrics: metrics.filter(m => m !== metric.value) });
                            }
                          }}
                        />
                        <Label htmlFor={metric.value} className="text-sm">
                          {metric.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="format">Report Format</Label>
                  <Select 
                    value={newReport.format} 
                    onValueChange={(value) => setNewReport({ ...newReport, format: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createReport} disabled={!newReport.name || !newReport.recipients?.length}>
                Create Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No scheduled reports yet</p>
              <p className="text-xs text-muted-foreground">Create your first automated report</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <Badge variant={report.isActive ? 'default' : 'secondary'}>
                      {report.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReportNow(report.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleReportStatus(report.id, !report.isActive)}
                    >
                      {report.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingReport(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Schedule:</span>
                    <p className="text-muted-foreground">
                      {getFrequencyLabel(report.frequency, report.dayOfWeek, report.dayOfMonth)} at {report.time}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Recipients:</span>
                    <p className="text-muted-foreground">
                      {report.recipients.join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Format:</span>
                    <p className="text-muted-foreground capitalize">
                      {report.format}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Last Sent:</span>
                      <p className="text-muted-foreground">
                        {report.lastSent ? formatDate(report.lastSent) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Next Scheduled:</span>
                      <p className="text-muted-foreground">
                        {report.nextScheduled ? formatDate(report.nextScheduled) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
