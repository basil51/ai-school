"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Shield, 
  BookOpen, 
  GraduationCap,
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Globe,
  Crown
} from 'lucide-react';

export default function SuperAdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data for all users across organizations
  const users = [
    {
      id: 1,
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@alnoor.edu.sa',
      avatar: '/avatars/ahmed.jpg',
      role: 'teacher',
      status: 'active',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '2 hours ago',
      joinDate: '2024-01-15',
      subjects: ['Mathematics', 'Physics'],
      students: 25,
      phone: '+966501234567',
      department: 'Science',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 2,
      name: 'Fatima Hassan',
      email: 'fatima.hassan@alnoor.edu.sa',
      avatar: '/avatars/fatima.jpg',
      role: 'student',
      status: 'active',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '1 day ago',
      joinDate: '2024-02-01',
      subjects: ['Mathematics', 'Biology', 'English'],
      students: null,
      phone: '+966501234568',
      department: 'Grade 10',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 3,
      name: 'Omar Khalil',
      email: 'omar.khalil@alnoor.edu.sa',
      avatar: '/avatars/omar.jpg',
      role: 'student',
      status: 'inactive',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '1 week ago',
      joinDate: '2024-01-20',
      subjects: ['Mathematics', 'Physics'],
      students: null,
      phone: '+966501234569',
      department: 'Grade 9',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 4,
      name: 'Layla Mahmoud',
      email: 'layla.mahmoud@alnoor.edu.sa',
      avatar: '/avatars/layla.jpg',
      role: 'teacher',
      status: 'active',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '30 minutes ago',
      joinDate: '2023-09-01',
      subjects: ['Chemistry', 'Biology'],
      students: 18,
      phone: '+966501234570',
      department: 'Science',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 5,
      name: 'Youssef Ibrahim',
      email: 'youssef.ibrahim@alnoor.edu.sa',
      avatar: '/avatars/youssef.jpg',
      role: 'admin',
      status: 'active',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '1 hour ago',
      joinDate: '2023-08-15',
      subjects: [],
      students: null,
      phone: '+966501234571',
      department: 'Administration',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 6,
      name: 'Nour Al-Zahra',
      email: 'nour.zahra@alnoor.edu.sa',
      avatar: '/avatars/nour.jpg',
      role: 'guardian',
      status: 'active',
      organization: 'Al-Noor School',
      organizationId: 'org-1',
      lastLogin: '3 days ago',
      joinDate: '2024-01-10',
      subjects: [],
      students: null,
      phone: '+966501234572',
      department: 'Parent',
      location: 'Riyadh, Saudi Arabia'
    },
    {
      id: 7,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@international.edu',
      avatar: '/avatars/sarah.jpg',
      role: 'teacher',
      status: 'active',
      organization: 'International School',
      organizationId: 'org-2',
      lastLogin: '4 hours ago',
      joinDate: '2023-07-01',
      subjects: ['English Literature', 'Creative Writing'],
      students: 30,
      phone: '+966501234573',
      department: 'Languages',
      location: 'Jeddah, Saudi Arabia'
    },
    {
      id: 8,
      name: 'Mohammed Al-Sheikh',
      email: 'mohammed.sheikh@international.edu',
      avatar: '/avatars/mohammed.jpg',
      role: 'admin',
      status: 'active',
      organization: 'International School',
      organizationId: 'org-2',
      lastLogin: '2 hours ago',
      joinDate: '2023-06-01',
      subjects: [],
      students: null,
      phone: '+966501234574',
      department: 'Administration',
      location: 'Jeddah, Saudi Arabia'
    },
    {
      id: 9,
      name: 'Aisha Al-Mansouri',
      email: 'aisha.mansouri@premium.edu',
      avatar: '/avatars/aisha.jpg',
      role: 'super_admin',
      status: 'active',
      organization: 'Premium Academy',
      organizationId: 'org-3',
      lastLogin: '1 hour ago',
      joinDate: '2023-05-01',
      subjects: [],
      students: null,
      phone: '+966501234575',
      department: 'System Administration',
      location: 'Dammam, Saudi Arabia'
    }
  ];

  const organizations = [
    { id: 'org-1', name: 'Al-Noor School', users: 6, location: 'Riyadh' },
    { id: 'org-2', name: 'International School', users: 2, location: 'Jeddah' },
    { id: 'org-3', name: 'Premium Academy', users: 1, location: 'Dammam' }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesOrg = selectedOrganization === 'all' || user.organizationId === selectedOrganization;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesOrg && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return <BookOpen className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'guardian': return <Users className="w-4 h-4" />;
      case 'super_admin': return <Crown className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'guardian': return 'bg-orange-100 text-orange-800';
      case 'super_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <UserX className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const globalStats = {
    totalUsers: users.length,
    totalOrganizations: organizations.length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
    admins: users.filter(u => u.role === 'admin').length,
    guardians: users.filter(u => u.role === 'guardian').length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              All Users
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all users across all organizations in the system
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Users
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">{globalStats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-xl font-bold text-blue-600">{globalStats.totalOrganizations}</p>
                </div>
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teachers</p>
                  <p className="text-xl font-bold text-blue-600">{globalStats.teachers}</p>
                </div>
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-xl font-bold text-green-600">{globalStats.students}</p>
                </div>
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-xl font-bold text-purple-600">{globalStats.admins}</p>
                </div>
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Guardians</p>
                  <p className="text-xl font-bold text-orange-600">{globalStats.guardians}</p>
                </div>
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Super Admins</p>
                  <p className="text-xl font-bold text-red-600">{globalStats.superAdmins}</p>
                </div>
                <Crown className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-xl font-bold text-green-600">{globalStats.active}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name, email, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedRole === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('all')}
                >
                  All Roles
                </Button>
                <Button
                  variant={selectedRole === 'teacher' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('teacher')}
                >
                  Teachers
                </Button>
                <Button
                  variant={selectedRole === 'student' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('student')}
                >
                  Students
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('admin')}
                >
                  Admins
                </Button>
                <Button
                  variant={selectedRole === 'super_admin' ? 'default' : 'outline'}
                  onClick={() => setSelectedRole('super_admin')}
                >
                  Super Admins
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedOrganization === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedOrganization('all')}
                >
                  All Organizations
                </Button>
                {organizations.map(org => (
                  <Button
                    key={org.id}
                    variant={selectedOrganization === org.id ? 'default' : 'outline'}
                    onClick={() => setSelectedOrganization(org.id)}
                  >
                    {org.name}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('all')}
                >
                  All Status
                </Button>
                <Button
                  variant={selectedStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={selectedStatus === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">By Organization</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                          <p className="text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {user.organization}
                            </Badge>
                            {getStatusIcon(user.status)}
                            <span className="text-sm text-gray-500">Last login: {user.lastLogin}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium">{user.department}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{user.location}</p>
                        </div>
                        {user.students && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Students</p>
                            <p className="font-medium">{user.students}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {user.subjects.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {user.subjects.map((subject, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">Joined: {user.joinDate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            <div className="grid gap-4">
              {organizations.map((org) => {
                const orgUsers = users.filter(u => u.organizationId === org.id);
                return (
                  <Card key={org.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {org.name}
                        <Badge variant="outline">{orgUsers.length} users</Badge>
                      </CardTitle>
                      <CardDescription>{org.location}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {orgUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleColor(user.role)}>
                                {getRoleIcon(user.role)}
                                <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                              </Badge>
                              {getStatusIcon(user.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global User Management</CardTitle>
                <CardDescription>
                  Perform actions on users across all organizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Mail className="w-6 h-6" />
                    <span>Send Global Email</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <UserCheck className="w-6 h-6" />
                    <span>Activate Users</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <UserX className="w-6 h-6" />
                    <span>Deactivate Users</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Download className="w-6 h-6" />
                    <span>Export All Data</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Settings className="w-6 h-6" />
                    <span>Bulk Settings</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Shield className="w-6 h-6" />
                    <span>Security Audit</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Globe className="w-6 h-6" />
                    <span>Global Reports</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Trash2 className="w-6 h-6" />
                    <span>Cleanup Tools</span>
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
