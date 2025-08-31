'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Download, 
  BarChart3, 
  PieChart,
  LineChart,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';

interface ReportMetric {
  id: string;
  name: string;
  type: 'number' | 'percentage' | 'currency' | 'duration';
  category: 'users' | 'documents' | 'questions' | 'performance' | 'engagement';
  description: string;
  icon: string;
}

interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  metrics: string[];
  timeRange: string;
  visible: boolean;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  metrics: ReportMetric[];
  charts: ReportChart[];
  filters: {
    dateRange: string;
    userRoles: string[];
    documentTypes: string[];
    activityTypes: string[];
  };
  format: 'pdf' | 'csv' | 'html' | 'json';
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}

interface CustomReportBuilderProps {
  organizationId: string;
  className?: string;
}

const AVAILABLE_METRICS: ReportMetric[] = [
  {
    id: 'total_users',
    name: 'Total Users',
    type: 'number',
    category: 'users',
    description: 'Total number of registered users',
    icon: 'users',
  },
  {
    id: 'active_users',
    name: 'Active Users',
    type: 'number',
    category: 'users',
    description: 'Users with activity in the selected period',
    icon: 'activity',
  },
  {
    id: 'user_retention',
    name: 'User Retention',
    type: 'percentage',
    category: 'users',
    description: 'Percentage of users who returned',
    icon: 'trending-up',
  },
  {
    id: 'total_documents',
    name: 'Total Documents',
    type: 'number',
    category: 'documents',
    description: 'Total number of uploaded documents',
    icon: 'file-text',
  },
  {
    id: 'documents_uploaded',
    name: 'Documents Uploaded',
    type: 'number',
    category: 'documents',
    description: 'Documents uploaded in the selected period',
    icon: 'upload',
  },
  {
    id: 'total_questions',
    name: 'Total Questions',
    type: 'number',
    category: 'questions',
    description: 'Total number of questions asked',
    icon: 'message-square',
  },
  {
    id: 'questions_per_user',
    name: 'Questions per User',
    type: 'number',
    category: 'questions',
    description: 'Average questions asked per user',
    icon: 'bar-chart-3',
  },
  {
    id: 'satisfaction_score',
    name: 'Satisfaction Score',
    type: 'number',
    category: 'engagement',
    description: 'Average user satisfaction rating',
    icon: 'star',
  },
  {
    id: 'system_uptime',
    name: 'System Uptime',
    type: 'percentage',
    category: 'performance',
    description: 'System availability percentage',
    icon: 'zap',
  },
  {
    id: 'response_time',
    name: 'Response Time',
    type: 'duration',
    category: 'performance',
    description: 'Average response time in seconds',
    icon: 'clock',
  },
];

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'area', label: 'Area Chart', icon: BarChart3 },
];

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

export default function CustomReportBuilder({ organizationId, className = '' }: CustomReportBuilderProps) {
  const { dict } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<CustomReport>({
    id: '',
    name: '',
    description: '',
    metrics: [],
    charts: [],
    filters: {
      dateRange: '30d',
      userRoles: ['student', 'teacher', 'admin'],
      documentTypes: ['pdf', 'docx', 'txt'],
      activityTypes: ['login', 'upload', 'question'],
    },
    format: 'pdf',
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      recipients: [],
    },
  });

  const addMetric = useCallback((metric: ReportMetric) => {
    if (!report.metrics.find(m => m.id === metric.id)) {
      setReport(prev => ({
        ...prev,
        metrics: [...prev.metrics, metric],
      }));
    }
  }, [report.metrics]);

  const removeMetric = useCallback((metricId: string) => {
    setReport(prev => ({
      ...prev,
      metrics: prev.metrics.filter(m => m.id !== metricId),
    }));
  }, []);

  const addChart = useCallback(() => {
    const newChart: ReportChart = {
      id: `chart_${Date.now()}`,
      type: 'line',
      title: 'New Chart',
      metrics: [],
      timeRange: '30d',
      visible: true,
    };
    setReport(prev => ({
      ...prev,
      charts: [...prev.charts, newChart],
    }));
  }, []);

  const updateChart = useCallback((chartId: string, updates: Partial<ReportChart>) => {
    setReport(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      ),
    }));
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setReport(prev => ({
      ...prev,
      charts: prev.charts.filter(c => c.id !== chartId),
    }));
  }, []);

  const exportReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name || 'report'}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  }, [report, organizationId]);

  const saveReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (response.ok) {
        setIsOpen(false);
        // Reset form or show success message
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }, [report, organizationId]);

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="metrics" className="space-y-4">
            <TabsList>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={report.name}
                    onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="report-format">Export Format</Label>
                  <Select value={report.format} onValueChange={(value: any) => setReport(prev => ({ ...prev, format: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Report Description</Label>
                <Input
                  value={report.description}
                  onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Selected Metrics</Label>
                  <Badge variant="secondary">{report.metrics.length} selected</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {report.metrics.map((metric) => (
                    <Card key={metric.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{metric.name}</div>
                          <div className="text-xs text-muted-foreground">{metric.description}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetric(metric.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <Label>Available Metrics</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {AVAILABLE_METRICS.filter(metric => !report.metrics.find(m => m.id === metric.id)).map((metric) => (
                      <Card key={metric.id} className="p-3 cursor-pointer hover:bg-muted" onClick={() => addMetric(metric)}>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{metric.name}</div>
                            <div className="text-xs text-muted-foreground">{metric.description}</div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Charts</Label>
                <Button onClick={addChart} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chart
                </Button>
              </div>

              <div className="space-y-4">
                {report.charts.map((chart) => (
                  <Card key={chart.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Input
                        value={chart.title}
                        onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                        className="w-64"
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateChart(chart.id, { visible: !chart.visible })}
                        >
                          {chart.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChart(chart.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Chart Type</Label>
                        <Select value={chart.type} onValueChange={(value: any) => updateChart(chart.id, { type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHART_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Time Range</Label>
                        <Select value={chart.timeRange} onValueChange={(value) => updateChart(chart.id, { timeRange: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_RANGES.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Metrics</Label>
                        <Select onValueChange={(value) => {
                          if (!chart.metrics.includes(value)) {
                            updateChart(chart.id, { metrics: [...chart.metrics, value] });
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {report.metrics.map((metric) => (
                              <SelectItem key={metric.id} value={metric.id}>
                                {metric.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {chart.metrics.length > 0 && (
                      <div className="mt-4">
                        <Label>Selected Metrics</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {chart.metrics.map((metricId) => {
                            const metric = report.metrics.find(m => m.id === metricId);
                            return metric ? (
                              <Badge key={metricId} variant="secondary">
                                {metric.name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => updateChart(chart.id, { 
                                    metrics: chart.metrics.filter(m => m !== metricId) 
                                  })}
                                >
                                  ×
                                </Button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date Range</Label>
                  <Select value={report.filters.dateRange} onValueChange={(value) => setReport(prev => ({ 
                    ...prev, 
                    filters: { ...prev.filters, dateRange: value } 
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>User Roles</Label>
                  <div className="space-y-2 mt-2">
                    {['student', 'teacher', 'admin', 'guardian'].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={role}
                          checked={report.filters.userRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReport(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  userRoles: [...prev.filters.userRoles, role],
                                },
                              }));
                            } else {
                              setReport(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  userRoles: prev.filters.userRoles.filter(r => r !== role),
                                },
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={role} className="capitalize">{role}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-schedule"
                  checked={report.schedule.enabled}
                  onCheckedChange={(checked) => setReport(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, enabled: checked as boolean },
                  }))}
                />
                <Label htmlFor="enable-schedule">Enable scheduled reports</Label>
              </div>

              {report.schedule.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select value={report.schedule.frequency} onValueChange={(value: any) => setReport(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, frequency: value },
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={report.schedule.time}
                      onChange={(e) => setReport(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, time: e.target.value },
                      }))}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={saveReport}>
              Save Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
