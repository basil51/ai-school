"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  //Filter, 
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
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; location?: string }>>([]);
  const [userItems, setUserItems] = useState<Array<{
    id: string | number;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    status: string;
    organization: string;
    organizationId: string | null;
    lastLogin?: string;
    joinDate?: string;
    subjects: string[];
    students: number | null;
    phone?: string;
    department?: string;
    location?: string;
  }>>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

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

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/super-admin/organizations');
        if (!res.ok) return;
        const data = await res.json();
        const mapped = (data || []).map((o: any) => ({ id: o.id, name: o.name, location: o.domain || '' }));
        setOrganizations(mapped);
      } catch (e) {
        // silent fail for now
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (selectedRole !== 'all') params.set('role', selectedRole);
        if (selectedOrganization !== 'all') params.set('organizationId', selectedOrganization);
        if (searchTerm) params.set('search', searchTerm);
        const res = await fetch(`/api/super-admin/users?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const mapped = (data.items || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          avatar: '',
          role: u.role,
          status: 'active',
          organization: u.organization?.name || '—',
          organizationId: u.organizationId || null,
          lastLogin: '',
          joinDate: new Date(u.createdAt).toISOString().slice(0, 10),
          subjects: [],
          students: null,
          phone: '',
          department: '',
          location: '',
        }));
        setUserItems(mapped);
        setTotal(data.total || 0);
      } catch (e) {
        // silent fail for now
      }
    };
    fetchUsers();
  }, [page, pageSize, selectedRole, selectedOrganization, searchTerm]);

  const filteredUsers = userItems; // now filtered server-side

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
                      <p className="text-xl font-bold text-gray-900">{total}</p>
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
            <div className="space-y-4">
              {/* Search Bar - Full Width */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              {/* Filter Dropdowns - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="super_admin">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Organization</label>
                  <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedRole !== 'all' || selectedOrganization !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {selectedRole !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Role: {selectedRole}
                      <button 
                        onClick={() => setSelectedRole('all')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedOrganization !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Org: {organizations.find(org => org.id === selectedOrganization)?.name}
                      <button 
                        onClick={() => setSelectedOrganization('all')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Status: {selectedStatus}
                      <button 
                        onClick={() => setSelectedStatus('all')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: {searchTerm}
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedRole('all');
                      setSelectedOrganization('all');
                      setSelectedStatus('all');
                      setSearchTerm('');
                    }}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
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
            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1); }}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            <div className="grid gap-4">
              {organizations.map((org) => {
                const orgUsers = userItems.filter(u => u.organizationId === org.id);
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
