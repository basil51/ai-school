'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
//import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
//import { Alert, AlertDescription } from '@/components/ui/alert';
//import { Progress } from '@/components/ui/progress';
import { 
  Link, 
  Plus, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  //AlertTriangle,
  //Clock,
  Users,
  BookOpen,
  GraduationCap,
  Shield,
  Database,
  Search,
  //Filter,
  Eye,
  Edit,
  //Trash2,
  //Download,
  //Upload,
  Activity,
  //BarChart3,
  Globe,
  Key,
  Server
} from 'lucide-react';

interface LMSIntegration {
  id: string;
  lmsType: 'canvas' | 'blackboard' | 'google_classroom' | 'moodle' | 'schoology' | 'brightspace' | 'sakai' | 'custom';
  lmsName: string;
  baseUrl: string;
  status: 'active' | 'inactive' | 'error' | 'pending' | 'configuring';
  lastSyncAt?: string;
  syncFrequency: number;
  autoSync: boolean;
  errorCount: number;
  lastError?: string;
  createdAt: string;
  _count: {
    courses: number;
    enrollments: number;
    assignments: number;
    grades: number;
    syncLogs: number;
  };
}

interface SSOIntegration {
  id: string;
  ssoType: 'saml' | 'oauth2' | 'openid_connect' | 'ldap' | 'active_directory' | 'google_workspace' | 'microsoft_azure' | 'custom';
  ssoName: string;
  status: 'active' | 'inactive' | 'error' | 'pending' | 'configuring';
  lastSyncAt?: string;
  autoProvision: boolean;
  errorCount: number;
  lastError?: string;
  createdAt: string;
  _count: {
    ssoUsers: number;
  };
}

interface SISIntegration {
  id: string;
  sisType: 'powerschool' | 'infinite_campus' | 'skyward' | 'gradelink' | 'renweb' | 'schooltool' | 'custom';
  sisName: string;
  baseUrl: string;
  status: 'active' | 'inactive' | 'error' | 'pending' | 'configuring';
  lastSyncAt?: string;
  syncFrequency: number;
  autoSync: boolean;
  errorCount: number;
  lastError?: string;
  createdAt: string;
  _count: {
    students: number;
    teachers: number;
    classes: number;
    syncLogs: number;
  };
}

const lmsTypeIcons = {
  canvas: Globe,
  blackboard: BookOpen,
  google_classroom: GraduationCap,
  moodle: Server,
  schoology: Users,
  brightspace: Activity,
  sakai: Database,
  custom: Settings,
} as const;

const ssoTypeIcons = {
  saml: Shield,
  oauth2: Key,
  openid_connect: Key,
  ldap: Database,
  active_directory: Server,
  google_workspace: Globe,
  microsoft_azure: Server,
  custom: Settings,
} as const;

const sisTypeIcons = {
  powerschool: GraduationCap,
  infinite_campus: BookOpen,
  skyward: Users,
  gradelink: Activity,
  renweb: Database,
  schooltool: Settings,
  custom: Settings,
} as const;

const statusColors = {
  active: 'default',
  inactive: 'secondary',
  error: 'destructive',
  pending: 'outline',
  configuring: 'secondary',
} as const;

export default function IntegrationsDashboard() {
  const [lmsIntegrations, setLmsIntegrations] = useState<LMSIntegration[]>([]);
  const [ssoIntegrations, setSsoIntegrations] = useState<SSOIntegration[]>([]);
  const [sisIntegrations, setSisIntegrations] = useState<SISIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'lms' | 'sso' | 'sis'>('lms');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
  });

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'canvas',
    baseUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    syncFrequency: 60,
    autoSync: false,
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const [lmsResponse, ssoResponse, sisResponse] = await Promise.all([
        fetch('/api/integrations/lms'),
        fetch('/api/integrations/sso'),
        fetch('/api/integrations/sis'),
      ]);

      if (lmsResponse.ok) {
        const lmsData = await lmsResponse.json();
        setLmsIntegrations(lmsData.integrations);
      }

      if (ssoResponse.ok) {
        const ssoData = await ssoResponse.json();
        setSsoIntegrations(ssoData.integrations);
      }

      if (sisResponse.ok) {
        const sisData = await sisResponse.json();
        setSisIntegrations(sisData.integrations);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async () => {
    try {
      const endpoint = createType === 'lms' ? '/api/integrations/lms' : 
                      createType === 'sso' ? '/api/integrations/sso' : 
                      '/api/integrations/sis';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lmsName: newIntegration.name,
          lmsType: newIntegration.type,
          baseUrl: newIntegration.baseUrl,
          apiKey: newIntegration.apiKey,
          clientId: newIntegration.clientId,
          clientSecret: newIntegration.clientSecret,
          syncFrequency: newIntegration.syncFrequency,
          autoSync: newIntegration.autoSync,
          configuration: {},
        }),
      });

      if (response.ok) {
        await fetchIntegrations();
        setIsCreateDialogOpen(false);
        setNewIntegration({
          name: '',
          type: 'canvas',
          baseUrl: '',
          apiKey: '',
          clientId: '',
          clientSecret: '',
          syncFrequency: 60,
          autoSync: false,
        });
      }
    } catch (error) {
      console.error('Error creating integration:', error);
    }
  };

  const handleSync = async (integrationId: string, type: 'lms' | 'sis') => {
    try {
      const endpoint = type === 'lms' ? 
        `/api/integrations/lms/${integrationId}/sync` : 
        `/api/integrations/sis/${integrationId}/sync`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'manual',
          syncCourses: true,
          syncEnrollments: true,
          syncAssignments: true,
          syncGrades: true,
        }),
      });

      if (response.ok) {
        await fetchIntegrations();
      }
    } catch (error) {
      console.error('Error syncing integration:', error);
    }
  };

  const getIntegrationStats = () => {
    const total = lmsIntegrations.length + ssoIntegrations.length + sisIntegrations.length;
    const active = [...lmsIntegrations, ...ssoIntegrations, ...sisIntegrations].filter(i => i.status === 'active').length;
    const errors = [...lmsIntegrations, ...ssoIntegrations, ...sisIntegrations].filter(i => i.status === 'error').length;
    const totalRecords = lmsIntegrations.reduce((sum, i) => sum + i._count.courses + i._count.enrollments, 0) +
                        ssoIntegrations.reduce((sum, i) => sum + i._count.ssoUsers, 0) +
                        sisIntegrations.reduce((sum, i) => sum + i._count.students + i._count.teachers, 0);

    return { total, active, errors, totalRecords };
  };

  const stats = getIntegrationStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Integrations</h1>
          <p className="text-muted-foreground">
            Connect with LMS, SSO, and SIS systems for seamless data synchronization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setCreateType('lms'); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add LMS
          </Button>
          <Button variant="outline" onClick={() => { setCreateType('sso'); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add SSO
          </Button>
          <Button variant="outline" onClick={() => { setCreateType('sis'); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add SIS
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Connected systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">
              Integrations with issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Synced data records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lms">LMS Integrations</TabsTrigger>
          <TabsTrigger value="sso">SSO Integrations</TabsTrigger>
          <TabsTrigger value="sis">SIS Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LMS Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  LMS Integrations
                </CardTitle>
                <CardDescription>
                  Learning Management System connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lmsIntegrations.slice(0, 5).map((integration) => {
                    const IconComponent = lmsTypeIcons[integration.lmsType];
                    return (
                      <div key={integration.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium">{integration.lmsName}</span>
                            <Badge variant={statusColors[integration.status]}>
                              {integration.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleSync(integration.id, 'lms')}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {integration._count.courses} courses • {integration._count.enrollments} enrollments
                        </div>
                        {integration.lastSyncAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SSO Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SSO Integrations
                </CardTitle>
                <CardDescription>
                  Single Sign-On authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ssoIntegrations.slice(0, 5).map((integration) => {
                    const IconComponent = ssoTypeIcons[integration.ssoType];
                    return (
                      <div key={integration.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium">{integration.ssoName}</span>
                            <Badge variant={statusColors[integration.status]}>
                              {integration.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {integration._count.ssoUsers} users
                        </div>
                        {integration.lastSyncAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SIS Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  SIS Integrations
                </CardTitle>
                <CardDescription>
                  Student Information Systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sisIntegrations.slice(0, 5).map((integration) => {
                    const IconComponent = sisTypeIcons[integration.sisType];
                    return (
                      <div key={integration.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium">{integration.sisName}</span>
                            <Badge variant={statusColors[integration.status]}>
                              {integration.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleSync(integration.id, 'sis')}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {integration._count.students} students • {integration._count.teachers} teachers
                        </div>
                        {integration.lastSyncAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
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

        <TabsContent value="lms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search LMS integrations..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="LMS Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="canvas">Canvas</SelectItem>
                  <SelectItem value="blackboard">Blackboard</SelectItem>
                  <SelectItem value="google_classroom">Google Classroom</SelectItem>
                  <SelectItem value="moodle">Moodle</SelectItem>
                  <SelectItem value="schoology">Schoology</SelectItem>
                  <SelectItem value="brightspace">Brightspace</SelectItem>
                  <SelectItem value="sakai">Sakai</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {lmsIntegrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No LMS Integrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your Learning Management System to sync courses and enrollments.
                  </p>
                  <Button onClick={() => { setCreateType('lms'); setIsCreateDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add LMS Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              lmsIntegrations.map((integration) => {
                const IconComponent = lmsTypeIcons[integration.lmsType];
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={statusColors[integration.status]}>
                            {integration.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSync(integration.id, 'lms')}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{integration.lmsName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{integration.baseUrl}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Courses</Label>
                          <p className="text-muted-foreground">{integration._count.courses}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Enrollments</Label>
                          <p className="text-muted-foreground">{integration._count.enrollments}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sync Frequency:</span>
                          <span>{integration.syncFrequency} minutes</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto Sync:</span>
                          <span>{integration.autoSync ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="sso" className="space-y-4">
          <div className="grid gap-4">
            {ssoIntegrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No SSO Integrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up Single Sign-On for seamless user authentication.
                  </p>
                  <Button onClick={() => { setCreateType('sso'); setIsCreateDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add SSO Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              ssoIntegrations.map((integration) => {
                const IconComponent = ssoTypeIcons[integration.ssoType];
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={statusColors[integration.status]}>
                            {integration.status}
                          </Badge>
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
                      <h4 className="font-semibold mb-2">{integration.ssoName}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">SSO Type</Label>
                          <p className="text-muted-foreground">{integration.ssoType}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Users</Label>
                          <p className="text-muted-foreground">{integration._count.ssoUsers}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto Provision:</span>
                          <span>{integration.autoProvision ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="sis" className="space-y-4">
          <div className="grid gap-4">
            {sisIntegrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No SIS Integrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your Student Information System to sync student and teacher data.
                  </p>
                  <Button onClick={() => { setCreateType('sis'); setIsCreateDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add SIS Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sisIntegrations.map((integration) => {
                const IconComponent = sisTypeIcons[integration.sisType];
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={statusColors[integration.status]}>
                            {integration.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSync(integration.id, 'sis')}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{integration.sisName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{integration.baseUrl}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Students</Label>
                          <p className="text-muted-foreground">{integration._count.students}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Teachers</Label>
                          <p className="text-muted-foreground">{integration._count.teachers}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sync Frequency:</span>
                          <span>{integration.syncFrequency} minutes</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto Sync:</span>
                          <span>{integration.autoSync ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Integration Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Add {createType.toUpperCase()} Integration
            </DialogTitle>
            <DialogDescription>
              Connect your {createType.toUpperCase()} system for data synchronization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="Enter integration name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {createType === 'lms' && (
                      <>
                        <SelectItem value="canvas">Canvas</SelectItem>
                        <SelectItem value="blackboard">Blackboard</SelectItem>
                        <SelectItem value="google_classroom">Google Classroom</SelectItem>
                        <SelectItem value="moodle">Moodle</SelectItem>
                        <SelectItem value="schoology">Schoology</SelectItem>
                        <SelectItem value="brightspace">Brightspace</SelectItem>
                        <SelectItem value="sakai">Sakai</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </>
                    )}
                    {createType === 'sso' && (
                      <>
                        <SelectItem value="saml">SAML</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                        <SelectItem value="openid_connect">OpenID Connect</SelectItem>
                        <SelectItem value="ldap">LDAP</SelectItem>
                        <SelectItem value="active_directory">Active Directory</SelectItem>
                        <SelectItem value="google_workspace">Google Workspace</SelectItem>
                        <SelectItem value="microsoft_azure">Microsoft Azure</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </>
                    )}
                    {createType === 'sis' && (
                      <>
                        <SelectItem value="powerschool">PowerSchool</SelectItem>
                        <SelectItem value="infinite_campus">Infinite Campus</SelectItem>
                        <SelectItem value="skyward">Skyward</SelectItem>
                        <SelectItem value="gradelink">GradeLink</SelectItem>
                        <SelectItem value="renweb">RenWeb</SelectItem>
                        <SelectItem value="schooltool">SchoolTool</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                value={newIntegration.baseUrl}
                onChange={(e) => setNewIntegration({ ...newIntegration, baseUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  type="password"
                  value={newIntegration.apiKey}
                  onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  value={newIntegration.clientId}
                  onChange={(e) => setNewIntegration({ ...newIntegration, clientId: e.target.value })}
                  placeholder="Enter client ID"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                type="password"
                value={newIntegration.clientSecret}
                onChange={(e) => setNewIntegration({ ...newIntegration, clientSecret: e.target.value })}
                placeholder="Enter client secret"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="syncFrequency">Sync Frequency (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newIntegration.syncFrequency}
                  onChange={(e) => setNewIntegration({ ...newIntegration, syncFrequency: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={newIntegration.autoSync}
                  onChange={(e) => setNewIntegration({ ...newIntegration, autoSync: e.target.checked })}
                />
                <Label htmlFor="autoSync">Enable Auto Sync</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIntegration}>Create Integration</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
