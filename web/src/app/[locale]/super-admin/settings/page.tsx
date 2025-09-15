"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
//import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  //Trash2, 
  Plus, 
  Edit, 
  Eye,
  Shield,
  Bell,
  //Users,
  //BookOpen,
  //Globe,
  //Mail,
  Database,
  Zap,
  //Lock,
  //Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Cloud,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  //Building2,
  //Crown,
  Activity
} from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const hasChanges= false;

  // Mock data for system settings
  const systemInfo = {
    version: '2.1.0',
    buildDate: '2024-01-15',
    lastUpdate: '2024-01-20',
    uptime: '15 days, 8 hours',
    environment: 'Production',
    region: 'Middle East',
    timezone: 'Asia/Riyadh',
    language: 'Arabic',
    currency: 'SAR'
  };

  const systemSettings = {
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '10 years',
    maxFileSize: '50MB',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png', 'mp4', 'mp3'],
    sessionTimeout: 60,
    passwordPolicy: 'enterprise',
    maxOrganizations: 100,
    maxUsersPerOrg: 1000,
    apiRateLimit: 1000,
    storageQuota: '1TB'
  };

  const securitySettings = {
    twoFactorAuth: true,
    ipWhitelist: true,
    loginAttempts: 3,
    lockoutDuration: 30,
    passwordExpiry: 60,
    passwordPolicy: 'enterprise',
    sessionSecurity: true,
    auditLogging: true,
    dataEncryption: true,
    sslEnforcement: true,
    apiSecurity: true,
    vulnerabilityScanning: true,
    intrusionDetection: true
  };

  const notificationSettings = {
    systemAlerts: true,
    securityAlerts: true,
    performanceAlerts: true,
    maintenanceNotifications: true,
    organizationAlerts: true,
    userActivityAlerts: true,
    backupNotifications: true,
    errorNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  };

  const integrations = [
    {
      name: 'AWS Cloud Services',
      status: 'connected',
      description: 'Cloud infrastructure and storage',
      lastSync: '2 hours ago',
      type: 'infrastructure'
    },
    {
      name: 'Google Workspace',
      status: 'connected',
      description: 'Email and collaboration tools',
      lastSync: '1 day ago',
      type: 'productivity'
    },
    {
      name: 'Microsoft Azure',
      status: 'connected',
      description: 'AI and analytics services',
      lastSync: '3 hours ago',
      type: 'ai'
    },
    {
      name: 'Stripe Payment',
      status: 'connected',
      description: 'Payment processing',
      lastSync: '1 hour ago',
      type: 'payment'
    },
    {
      name: 'Twilio SMS',
      status: 'disconnected',
      description: 'SMS notifications',
      lastSync: 'Never',
      type: 'communication'
    },
    {
      name: 'Slack Integration',
      status: 'pending',
      description: 'Team communication',
      lastSync: 'Never',
      type: 'communication'
    }
  ];

  const systemResources = [
    {
      resource: 'CPU Usage',
      current: 45,
      max: 100,
      status: 'healthy',
      unit: '%'
    },
    {
      resource: 'Memory Usage',
      current: 68,
      max: 100,
      status: 'warning',
      unit: '%'
    },
    {
      resource: 'Disk Space',
      current: 78,
      max: 100,
      status: 'warning',
      unit: '%'
    },
    {
      resource: 'Network I/O',
      current: 23,
      max: 100,
      status: 'healthy',
      unit: '%'
    },
    {
      resource: 'Database Connections',
      current: 45,
      max: 200,
      status: 'healthy',
      unit: 'connections'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'CPU Usage': return <Cpu className="w-4 h-4" />;
      case 'Memory Usage': return <MemoryStick className="w-4 h-4" />;
      case 'Disk Space': return <HardDrive className="w-4 h-4" />;
      case 'Network I/O': return <Network className="w-4 h-4" />;
      case 'Database Connections': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-gray-600" />
              System Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure and manage global system settings and infrastructure
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Config
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Config
            </Button>
            <Button 
              className="flex items-center gap-2"
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Version</p>
                <p className="text-xl font-bold text-blue-600">{systemInfo.version}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-xl font-bold text-green-600">{systemInfo.uptime}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Environment</p>
                <p className="text-xl font-bold text-purple-600">{systemInfo.environment}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Region</p>
                <p className="text-xl font-bold text-orange-600">{systemInfo.region}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Global system settings and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable access for system maintenance</p>
                    </div>
                    <Switch id="maintenanceMode" defaultChecked={systemSettings.maintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoBackup">Automatic Backup</Label>
                      <p className="text-sm text-gray-600">Enable automatic system backup</p>
                    </div>
                    <Switch id="autoBackup" defaultChecked={systemSettings.autoBackup} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Input id="backupFrequency" defaultValue={systemSettings.backupFrequency} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Data Retention Period</Label>
                    <Input id="dataRetention" defaultValue={systemSettings.dataRetention} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Maximum File Size</Label>
                    <Input id="maxFileSize" defaultValue={systemSettings.maxFileSize} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue={systemSettings.sessionTimeout} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxOrganizations">Max Organizations</Label>
                    <Input id="maxOrganizations" type="number" defaultValue={systemSettings.maxOrganizations} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsersPerOrg">Max Users per Organization</Label>
                    <Input id="maxUsersPerOrg" type="number" defaultValue={systemSettings.maxUsersPerOrg} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input id="apiRateLimit" type="number" defaultValue={systemSettings.apiRateLimit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageQuota">Storage Quota per Organization</Label>
                    <Input id="storageQuota" defaultValue={systemSettings.storageQuota} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure global security policies and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Require 2FA for all users</p>
                    </div>
                    <Switch id="twoFactorAuth" defaultChecked={securitySettings.twoFactorAuth} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                      <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                    </div>
                    <Switch id="ipWhitelist" defaultChecked={securitySettings.ipWhitelist} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sessionSecurity">Session Security</Label>
                      <p className="text-sm text-gray-600">Enhanced session security measures</p>
                    </div>
                    <Switch id="sessionSecurity" defaultChecked={securitySettings.sessionSecurity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auditLogging">Audit Logging</Label>
                      <p className="text-sm text-gray-600">Log all system activities</p>
                    </div>
                    <Switch id="auditLogging" defaultChecked={securitySettings.auditLogging} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dataEncryption">Data Encryption</Label>
                      <p className="text-sm text-gray-600">Encrypt sensitive data at rest</p>
                    </div>
                    <Switch id="dataEncryption" defaultChecked={securitySettings.dataEncryption} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sslEnforcement">SSL Enforcement</Label>
                      <p className="text-sm text-gray-600">Force HTTPS for all connections</p>
                    </div>
                    <Switch id="sslEnforcement" defaultChecked={securitySettings.sslEnforcement} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="apiSecurity">API Security</Label>
                      <p className="text-sm text-gray-600">Enhanced API security measures</p>
                    </div>
                    <Switch id="apiSecurity" defaultChecked={securitySettings.apiSecurity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vulnerabilityScanning">Vulnerability Scanning</Label>
                      <p className="text-sm text-gray-600">Regular security vulnerability scans</p>
                    </div>
                    <Switch id="vulnerabilityScanning" defaultChecked={securitySettings.vulnerabilityScanning} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="intrusionDetection">Intrusion Detection</Label>
                      <p className="text-sm text-gray-600">Monitor for suspicious activities</p>
                    </div>
                    <Switch id="intrusionDetection" defaultChecked={securitySettings.intrusionDetection} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                    <Input id="loginAttempts" type="number" defaultValue={securitySettings.loginAttempts} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                    <Input id="lockoutDuration" type="number" defaultValue={securitySettings.lockoutDuration} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input id="passwordExpiry" type="number" defaultValue={securitySettings.passwordExpiry} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordPolicy">Password Policy</Label>
                    <Input id="passwordPolicy" defaultValue={securitySettings.passwordPolicy} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemAlerts">System Alerts</Label>
                      <p className="text-sm text-gray-600">Send system-wide alerts</p>
                    </div>
                    <Switch id="systemAlerts" defaultChecked={notificationSettings.systemAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="securityAlerts">Security Alerts</Label>
                      <p className="text-sm text-gray-600">Send security-related notifications</p>
                    </div>
                    <Switch id="securityAlerts" defaultChecked={notificationSettings.securityAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="performanceAlerts">Performance Alerts</Label>
                      <p className="text-sm text-gray-600">Send performance-related notifications</p>
                    </div>
                    <Switch id="performanceAlerts" defaultChecked={notificationSettings.performanceAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceNotifications">Maintenance Notifications</Label>
                      <p className="text-sm text-gray-600">Send maintenance-related notifications</p>
                    </div>
                    <Switch id="maintenanceNotifications" defaultChecked={notificationSettings.maintenanceNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="organizationAlerts">Organization Alerts</Label>
                      <p className="text-sm text-gray-600">Send organization-related notifications</p>
                    </div>
                    <Switch id="organizationAlerts" defaultChecked={notificationSettings.organizationAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="userActivityAlerts">User Activity Alerts</Label>
                      <p className="text-sm text-gray-600">Send user activity notifications</p>
                    </div>
                    <Switch id="userActivityAlerts" defaultChecked={notificationSettings.userActivityAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backupNotifications">Backup Notifications</Label>
                      <p className="text-sm text-gray-600">Send backup-related notifications</p>
                    </div>
                    <Switch id="backupNotifications" defaultChecked={notificationSettings.backupNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="errorNotifications">Error Notifications</Label>
                      <p className="text-sm text-gray-600">Send error-related notifications</p>
                    </div>
                    <Switch id="errorNotifications" defaultChecked={notificationSettings.errorNotifications} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  System Integrations
                </CardTitle>
                <CardDescription>
                  Manage integrations with external services and platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                        <p className="text-xs text-gray-500">Last sync: {integration.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        <span className="ml-1 capitalize">{integration.status}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {integration.type}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Resources
                </CardTitle>
                <CardDescription>
                  Monitor system resource usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemResources.map((resource, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.resource)}
                        <span className="font-medium">{resource.resource}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {resource.current}{resource.unit}
                        </span>
                        <Badge className={getStatusColor(resource.status)}>
                          {getStatusIcon(resource.status)}
                          <span className="ml-1 capitalize">{resource.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          resource.status === 'healthy' ? 'bg-green-500' :
                          resource.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(resource.current / resource.max) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resource.current} / {resource.max} {resource.unit}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
