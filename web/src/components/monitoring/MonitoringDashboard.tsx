'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
//import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Plus, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Database,
  Search,
  Eye,
  Edit,
  //Trash2,
  //Download,
  //Upload,
  Target,
  Gauge,
  TrendingUp,
  //TrendingDown,
  //Server,
  //Globe,
  //Zap,
  //Shield,
  Heart,
  Bell,
  BellRing,
  AlertCircle,
  Info,
  //Wifi,
  //WifiOff,
  //Cpu,
  //HardDrive,
  //MemoryStick
} from 'lucide-react';

interface MonitoringDashboard {
  id: string;
  dashboardName: string;
  dashboardType: 'system_overview' | 'performance_monitoring' | 'usage_analytics' | 'health_monitoring' | 'custom';
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  refreshInterval: number;
  autoRefresh: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  widgets: MonitoringWidget[];
  _count: {
    widgets: number;
  };
}

interface MonitoringWidget {
  id: string;
  widgetName: string;
  widgetType: 'metric_chart' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'gauge' | 'table' | 'alert_list' | 'health_status' | 'custom';
  position: any;
  configuration: any;
  refreshInterval: number;
  isVisible: boolean;
  createdAt: string;
}

interface SystemMetric {
  id: string;
  metricName: string;
  metricType: 'counter' | 'gauge' | 'histogram' | 'summary' | 'custom';
  value: number;
  unit?: string;
  tags?: any;
  timestamp: string;
}

interface HealthCheck {
  id: string;
  checkName: string;
  checkType: 'api_endpoint' | 'database' | 'external_service' | 'system_resource' | 'custom';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime?: number;
  errorMessage?: string;
  lastCheckedAt: string;
}

interface Alert {
  id: string;
  alertName: string;
  alertType: 'threshold_breach' | 'error_rate' | 'performance_degradation' | 'system_down' | 'custom';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  message: string;
  description?: string;
  source?: string;
  createdAt: string;
  acknowledgedUser?: {
    id: string;
    name: string;
    email: string;
  };
  resolvedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

const dashboardTypeIcons = {
  system_overview: Activity,
  performance_monitoring: BarChart3,
  usage_analytics: Users,
  health_monitoring: Heart,
  custom: Settings,
} as const;

/*const widgetTypeIcons = {
  metric_chart: BarChart3,
  line_chart: TrendingUp,
  bar_chart: BarChart3,
  pie_chart: Target,
  gauge: Gauge,
  table: Database,
  alert_list: Bell,
  health_status: Heart,
  custom: Settings,
} as const;*/

const healthStatusIcons = {
  healthy: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle,
  unknown: AlertCircle,
} as const;

const healthStatusColors = {
  healthy: 'default',
  warning: 'secondary',
  critical: 'destructive',
  unknown: 'outline',
} as const;

const alertSeverityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  emergency: BellRing,
} as const;

const alertSeverityColors = {
  info: 'default',
  warning: 'secondary',
  critical: 'destructive',
  emergency: 'destructive',
} as const;

const alertStatusColors = {
  active: 'destructive',
  acknowledged: 'secondary',
  resolved: 'default',
  suppressed: 'outline',
} as const;

export default function MonitoringDashboard() {
  const [dashboards, setDashboards] = useState<MonitoringDashboard[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDashboard, setSelectedDashboard] = useState<MonitoringDashboard | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    dashboardType: 'all',
    status: 'all',
    search: '',
  });

  const [newDashboard, setNewDashboard] = useState({
    dashboardName: '',
    dashboardType: 'system_overview' as const,
    description: '',
    isDefault: false,
    isPublic: false,
    refreshInterval: 30,
    autoRefresh: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardsResponse, metricsResponse, healthResponse, alertsResponse] = await Promise.all([
        fetch('/api/monitoring/dashboards'),
        fetch('/api/monitoring/metrics'),
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/alerts'),
      ]);

      if (dashboardsResponse.ok) {
        const dashboardsData = await dashboardsResponse.json();
        setDashboards(dashboardsData.dashboards);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthChecks(healthData.healthChecks);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  /*const handleDashboardSelect = (dashboard: MonitoringDashboard) => {
    setSelectedDashboard(dashboard);
  };*/

  const handleCreateDashboard = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDashboard,
          configuration: {},
        }),
      });

      if (response.ok) {
        await fetchData();
        setIsCreateDialogOpen(false);
        setNewDashboard({
          dashboardName: '',
          dashboardType: 'system_overview',
          description: '',
          isDefault: false,
          isPublic: false,
          refreshInterval: 30,
          autoRefresh: true,
        });
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts?alertId=${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'acknowledged',
          acknowledgedBy: 'current-user-id', // This should come from session
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const filteredDashboards = dashboards.filter(dashboard => {
    if (filters.dashboardType !== 'all' && dashboard.dashboardType !== filters.dashboardType) return false;
    if (filters.search && !dashboard.dashboardName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getSystemStats = () => {
    const totalDashboards = dashboards.length;
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const healthyChecks = healthChecks.filter(h => h.status === 'healthy').length;
    const totalChecks = healthChecks.length;
    const avgResponseTime = healthChecks.reduce((sum, h) => sum + (h.responseTime || 0), 0) / totalChecks || 0;

    return { totalDashboards, activeAlerts, healthyChecks, totalChecks, avgResponseTime };
  };

  const stats = getSystemStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Continuous Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring, performance metrics, and automated health checks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dashboards</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDashboards}</div>
            <p className="text-xs text-muted-foreground">
              Monitoring dashboards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Alerts requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Heart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.healthyChecks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalChecks > 0 ? Math.round((stats.healthyChecks / stats.totalChecks) * 100) : 0}% healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.round(stats.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Latest system alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert) => {
                    const SeverityIcon = alertSeverityIcons[alert.severity];
                    return (
                      <div key={alert.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <SeverityIcon className="h-4 w-4" />
                            <Badge variant={alertSeverityColors[alert.severity]}>
                              {alert.severity}
                            </Badge>
                            <Badge variant={alertStatusColors[alert.status]}>
                              {alert.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{alert.alertName}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        {alert.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* System Health Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system health status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthChecks.slice(0, 8).map((check) => {
                    const StatusIcon = healthStatusIcons[check.status];
                    return (
                      <div key={check.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium">{check.checkName}</span>
                            <Badge variant={healthStatusColors[check.status]}>
                              {check.status}
                            </Badge>
                          </div>
                          {check.responseTime && (
                            <span className="text-sm text-muted-foreground">
                              {check.responseTime}ms
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {check.checkType} • Last checked: {new Date(check.lastCheckedAt).toLocaleString()}
                        </div>
                        {check.errorMessage && (
                          <div className="text-sm text-red-600 mt-1">
                            {check.errorMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.dashboardType}
                onValueChange={(value) => setFilters({ ...filters, dashboardType: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dashboard Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system_overview">System Overview</SelectItem>
                  <SelectItem value="performance_monitoring">Performance</SelectItem>
                  <SelectItem value="usage_analytics">Usage Analytics</SelectItem>
                  <SelectItem value="health_monitoring">Health Monitoring</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredDashboards.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Dashboards Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first monitoring dashboard to track system metrics.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredDashboards.map((dashboard) => {
                const IconComponent = dashboardTypeIcons[dashboard.dashboardType];
                return (
                  <Card key={dashboard.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {dashboard.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                          {dashboard.isPublic && (
                            <Badge variant="secondary">Public</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{dashboard.dashboardName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{dashboard.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Widgets</Label>
                          <p className="text-muted-foreground">{dashboard._count.widgets}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Refresh Interval</Label>
                          <p className="text-muted-foreground">{dashboard.refreshInterval}s</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created by:</span>
                          <span>{dashboard.creator.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto Refresh:</span>
                          <span>{dashboard.autoRefresh ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {healthChecks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Health Checks</h3>
                  <p className="text-muted-foreground mb-4">
                    Health check data will appear here when configured.
                  </p>
                </CardContent>
              </Card>
            ) : (
              healthChecks.map((check) => {
                const StatusIcon = healthStatusIcons[check.status];
                return (
                  <Card key={check.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge variant={healthStatusColors[check.status]}>
                            {check.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(check.lastCheckedAt).toLocaleString()}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{check.checkName}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Check Type</Label>
                          <p className="text-muted-foreground">{check.checkType}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Response Time</Label>
                          <p className="text-muted-foreground">{check.responseTime ? `${check.responseTime}ms` : 'N/A'}</p>
                        </div>
                      </div>
                      {check.errorMessage && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm text-red-600">
                            <strong>Error:</strong> {check.errorMessage}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                  <p className="text-muted-foreground mb-4">
                    System alerts will appear here when triggered.
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => {
                const SeverityIcon = alertSeverityIcons[alert.severity];
                return (
                  <Card key={alert.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <SeverityIcon className="h-4 w-4" />
                          <Badge variant={alertSeverityColors[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          <Badge variant={alertStatusColors[alert.status]}>
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{alert.alertName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Type: {alert.alertType} • Source: {alert.source || 'System'}
                        </div>
                        {alert.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {metrics.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Metrics</h3>
                  <p className="text-muted-foreground mb-4">
                    System metrics will appear here when collected.
                  </p>
                </CardContent>
              </Card>
            ) : (
              metrics.map((metric) => (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <Badge variant="outline">{metric.metricType}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{metric.metricName}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">Value</Label>
                        <p className="text-muted-foreground">{metric.value} {metric.unit || ''}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Type</Label>
                        <p className="text-muted-foreground">{metric.metricType}</p>
                      </div>
                    </div>
                    {metric.tags && Object.keys(metric.tags).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          <strong>Tags:</strong> {JSON.stringify(metric.tags)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Monitoring Dashboard</DialogTitle>
            <DialogDescription>
              Create a new monitoring dashboard for system metrics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dashboardType">Dashboard Type</Label>
                <Select
                  value={newDashboard.dashboardType}
                  onValueChange={(value: any) => setNewDashboard({ ...newDashboard, dashboardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dashboard type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_overview">System Overview</SelectItem>
                    <SelectItem value="performance_monitoring">Performance Monitoring</SelectItem>
                    <SelectItem value="usage_analytics">Usage Analytics</SelectItem>
                    <SelectItem value="health_monitoring">Health Monitoring</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Input
                  type="number"
                  min="5"
                  value={newDashboard.refreshInterval}
                  onChange={(e) => setNewDashboard({ ...newDashboard, refreshInterval: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dashboardName">Dashboard Name</Label>
              <Input
                value={newDashboard.dashboardName}
                onChange={(e) => setNewDashboard({ ...newDashboard, dashboardName: e.target.value })}
                placeholder="Enter dashboard name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                value={newDashboard.description}
                onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                placeholder="Enter dashboard description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newDashboard.isDefault}
                  onChange={(e) => setNewDashboard({ ...newDashboard, isDefault: e.target.checked })}
                />
                <Label htmlFor="isDefault">Set as Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newDashboard.isPublic}
                  onChange={(e) => setNewDashboard({ ...newDashboard, isPublic: e.target.checked })}
                />
                <Label htmlFor="isPublic">Make Public</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={newDashboard.autoRefresh}
                onChange={(e) => setNewDashboard({ ...newDashboard, autoRefresh: e.target.checked })}
              />
              <Label htmlFor="autoRefresh">Enable Auto Refresh</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
