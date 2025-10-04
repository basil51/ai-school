"use client";

import React, { useState } from 'react';
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
  //Settings,
  MoreHorizontal,
  Edit,
  //Trash2,
  Eye,
  Download,
  Upload,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data for users
  const users = [
    {
      id: 1,
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@school.edu',
      avatar: '/avatars/ahmed.jpg',
      role: 'teacher',
      status: 'active',
      lastLogin: '2 hours ago',
      joinDate: '2024-01-15',
      subjects: ['Mathematics', 'Physics'],
      students: 25,
      organization: 'Al-Noor School',
      phone: '+966501234567',
      department: 'Science'
    },
    {
      id: 2,
      name: 'Fatima Hassan',
      email: 'fatima.hassan@school.edu',
      avatar: '/avatars/fatima.jpg',
      role: 'student',
      status: 'active',
      lastLogin: '1 day ago',
      joinDate: '2024-02-01',
      subjects: ['Mathematics', 'Biology', 'English'],
      students: null,
      organization: 'Al-Noor School',
      phone: '+966501234568',
      department: 'Grade 10'
    },
    {
      id: 3,
      name: 'Omar Khalil',
      email: 'omar.khalil@school.edu',
      avatar: '/avatars/omar.jpg',
      role: 'student',
      status: 'inactive',
      lastLogin: '1 week ago',
      joinDate: '2024-01-20',
      subjects: ['Mathematics', 'Physics'],
      students: null,
      organization: 'Al-Noor School',
      phone: '+966501234569',
      department: 'Grade 9'
    },
    {
      id: 4,
      name: 'Layla Mahmoud',
      email: 'layla.mahmoud@school.edu',
      avatar: '/avatars/layla.jpg',
      role: 'teacher',
      status: 'active',
      lastLogin: '30 minutes ago',
      joinDate: '2023-09-01',
      subjects: ['Chemistry', 'Biology'],
      students: 18,
      organization: 'Al-Noor School',
      phone: '+966501234570',
      department: 'Science'
    },
    {
      id: 5,
      name: 'Youssef Ibrahim',
      email: 'youssef.ibrahim@school.edu',
      avatar: '/avatars/youssef.jpg',
      role: 'admin',
      status: 'active',
      lastLogin: '1 hour ago',
      joinDate: '2023-08-15',
      subjects: [],
      students: null,
      organization: 'Al-Noor School',
      phone: '+966501234571',
      department: 'Administration'
    },
    {
      id: 6,
      name: 'Nour Al-Zahra',
      email: 'nour.zahra@school.edu',
      avatar: '/avatars/nour.jpg',
      role: 'guardian',
      status: 'active',
      lastLogin: '3 days ago',
      joinDate: '2024-01-10',
      subjects: [],
      students: null,
      organization: 'Al-Noor School',
      phone: '+966501234572',
      department: 'Parent'
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return <BookOpen className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'guardian': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'guardian': return 'bg-orange-100 text-orange-800';
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

  const roleStats = {
    total: users.length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
    admins: users.filter(u => u.role === 'admin').length,
    guardians: users.filter(u => u.role === 'guardian').length,
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
              Manage Users
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all users in your school including teachers, students, and guardians
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">{roleStats.total}</p>
                </div>
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teachers</p>
                  <p className="text-xl font-bold text-blue-600">{roleStats.teachers}</p>
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
                  <p className="text-xl font-bold text-green-600">{roleStats.students}</p>
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
                  <p className="text-xl font-bold text-purple-600">{roleStats.admins}</p>
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
                  <p className="text-xl font-bold text-orange-600">{roleStats.guardians}</p>
                </div>
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-xl font-bold text-green-600">{roleStats.active}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-xl font-bold text-red-600">{roleStats.inactive}</p>
                </div>
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="min-w-[150px]">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="guardian">Guardians</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed View</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
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
                              <span className="ml-1 capitalize">{user.role}</span>
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

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </Badge>
                        {getStatusIcon(user.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{user.department}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Join Date</p>
                        <p className="font-medium">{user.joinDate}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Last Login</p>
                        <p className="font-medium">{user.lastLogin}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>
                  Perform actions on multiple users at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Mail className="w-6 h-6" />
                    <span>Send Email</span>
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
                    <span>Export Selected</span>
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
