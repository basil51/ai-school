"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Edit, 
  Eye,
  Shield,
  Bell,
  Users,
  BookOpen,
  Globe,
  Mail,
  Database,
  Zap,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data for school settings
  const schoolInfo = {
    name: 'Al-Noor International School',
    address: '123 Education Street, Riyadh, Saudi Arabia',
    phone: '+966 11 123 4567',
    email: 'info@alnoor.edu.sa',
    website: 'www.alnoor.edu.sa',
    established: '2010',
    accreditation: 'Ministry of Education, Saudi Arabia',
    timezone: 'Asia/Riyadh',
    language: 'Arabic',
    currency: 'SAR'
  };

  const academicSettings = {
    academicYear: '2024-2025',
    semesters: 2,
    gradingScale: '100-point',
    attendanceThreshold: 85,
    maxAbsences: 10,
    examPeriods: 4,
    breakPeriods: 3
  };

  const systemSettings = {
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '7 years',
    maxFileSize: '10MB',
    allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png'],
    sessionTimeout: 30,
    passwordPolicy: 'strong'
  };

  const notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    parentUpdates: true,
    teacherAlerts: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true
  };

  const securitySettings = {
    twoFactorAuth: true,
    ipWhitelist: false,
    loginAttempts: 5,
    lockoutDuration: 15,
    passwordExpiry: 90,
    passwordPolicy: 'strong',
    sessionSecurity: true,
    auditLogging: true,
    dataEncryption: true
  };

  const integrations = [
    {
      name: 'Google Classroom',
      status: 'connected',
      description: 'Sync assignments and grades',
      lastSync: '2 hours ago'
    },
    {
      name: 'Microsoft Teams',
      status: 'connected',
      description: 'Video conferencing integration',
      lastSync: '1 day ago'
    },
    {
      name: 'Zoom',
      status: 'disconnected',
      description: 'Virtual classroom support',
      lastSync: 'Never'
    },
    {
      name: 'Canvas LMS',
      status: 'pending',
      description: 'Learning management system',
      lastSync: 'Never'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
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
              School Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure and manage your school's settings and preferences
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Settings
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Settings
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

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  School Information
                </CardTitle>
                <CardDescription>
                  Basic information about your school
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" defaultValue={schoolInfo.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="established">Established Year</Label>
                    <Input id="established" defaultValue={schoolInfo.established} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={schoolInfo.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={schoolInfo.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" defaultValue={schoolInfo.website} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue={schoolInfo.timezone} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" defaultValue={schoolInfo.address} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Input id="language" defaultValue={schoolInfo.language} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" defaultValue={schoolInfo.currency} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accreditation">Accreditation</Label>
                    <Input id="accreditation" defaultValue={schoolInfo.accreditation} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Academic Settings
                </CardTitle>
                <CardDescription>
                  Configure academic year and grading policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input id="academicYear" defaultValue={academicSettings.academicYear} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semesters">Number of Semesters</Label>
                    <Input id="semesters" type="number" defaultValue={academicSettings.semesters} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradingScale">Grading Scale</Label>
                    <Input id="gradingScale" defaultValue={academicSettings.gradingScale} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
                    <Input id="attendanceThreshold" type="number" defaultValue={academicSettings.attendanceThreshold} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAbsences">Maximum Absences</Label>
                    <Input id="maxAbsences" type="number" defaultValue={academicSettings.maxAbsences} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examPeriods">Exam Periods</Label>
                    <Input id="examPeriods" type="number" defaultValue={academicSettings.examPeriods} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  System-wide settings and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable access for maintenance</p>
                    </div>
                    <Switch id="maintenanceMode" defaultChecked={systemSettings.maintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoBackup">Automatic Backup</Label>
                      <p className="text-sm text-gray-600">Enable automatic data backup</p>
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
                  Configure notification preferences for different user types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Send notifications via email</p>
                    </div>
                    <Switch id="emailNotifications" defaultChecked={notificationSettings.emailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Send notifications via SMS</p>
                    </div>
                    <Switch id="smsNotifications" defaultChecked={notificationSettings.smsNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-gray-600">Send push notifications to mobile apps</p>
                    </div>
                    <Switch id="pushNotifications" defaultChecked={notificationSettings.pushNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="parentUpdates">Parent Updates</Label>
                      <p className="text-sm text-gray-600">Send regular updates to parents</p>
                    </div>
                    <Switch id="parentUpdates" defaultChecked={notificationSettings.parentUpdates} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="teacherAlerts">Teacher Alerts</Label>
                      <p className="text-sm text-gray-600">Send alerts to teachers</p>
                    </div>
                    <Switch id="teacherAlerts" defaultChecked={notificationSettings.teacherAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-gray-600">Generate and send weekly reports</p>
                    </div>
                    <Switch id="weeklyReports" defaultChecked={notificationSettings.weeklyReports} />
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
                  Configure security policies and access controls
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

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Third-Party Integrations
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
                        <Zap className="w-5 h-5 text-gray-600" />
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
        </Tabs>
      </div>
    </div>
  );
}
