'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Save,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/useTranslations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'sick';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  student: Student;
  recordedByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface AttendanceManagementProps {
  organizationId: string;
  className?: string;
}

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  { value: 'sick', label: 'Sick', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
];

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function AttendanceManagement({ organizationId, className = '' }: AttendanceManagementProps) {
  const { dict } = useTranslations();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkAttendance, setBulkAttendance] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users?organizationId=${organizationId}&role=student`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [organizationId]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/attendance?organizationId=${organizationId}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  }, [organizationId, selectedDate]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const updateAttendance = async (studentId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          studentId,
          date: selectedDate,
          status,
          notes,
        }),
      });

      if (response.ok) {
        toast.success('Attendance updated successfully');
        fetchAttendance();
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const bulkUpdateAttendance = async () => {
    try {
      const attendanceRecords = Object.entries(bulkAttendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const response = await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          date: selectedDate,
          attendanceRecords,
        }),
      });

      if (response.ok) {
        toast.success('Bulk attendance updated successfully');
        setIsBulkEditOpen(false);
        setBulkAttendance({});
        fetchAttendance();
      } else {
        toast.error('Failed to update bulk attendance');
      }
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      toast.error('Failed to update bulk attendance');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const sick = attendanceRecords.filter(r => r.status === 'sick').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      sick,
      attendanceRate,
    };
  };

  const getFilteredRecords = () => {
    let filtered = attendanceRecords;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    if (filterStudent !== 'all') {
      filtered = filtered.filter(record => record.studentId === filterStudent);
    }

    return filtered;
  };

  const exportAttendance = () => {
    const csvContent = [
      'Student Name,Email,Date,Status,Check In,Check Out,Notes',
      ...getFilteredRecords().map(record => 
        `"${record.student.name}","${record.student.email}","${record.date}","${record.status}","${record.checkInTime || ''}","${record.checkOutTime || ''}","${record.notes || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const stats = getAttendanceStats();
  const filteredRecords = getFilteredRecords();

  const chartData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
    { name: 'Late', value: stats.late, color: '#f59e0b' },
    { name: 'Excused', value: stats.excused, color: '#3b82f6' },
    { name: 'Sick', value: stats.sick, color: '#8b5cf6' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Bulk Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Attendance Update - {selectedDate}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Filter by Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {ATTENDANCE_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Student</Label>
                    <Select value={filterStudent} onValueChange={setFilterStudent}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                      <Select
                        value={bulkAttendance[student.id] || 'present'}
                        onValueChange={(value) => setBulkAttendance(prev => ({ ...prev, [student.id]: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTENDANCE_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={bulkUpdateAttendance}>
                    <Save className="h-4 w-4 mr-2" />
                    Save All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={exportAttendance}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  Enrolled students
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.attendanceRate}% attendance rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-xs text-muted-foreground">
                  Students absent
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                <div className="text-xs text-muted-foreground">
                  Students late
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ATTENDANCE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Student</Label>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {selectedDate}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading attendance records...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.student.name}</div>
                            <div className="text-sm text-muted-foreground">{record.student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>
                          {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell>
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={record.status}
                            onValueChange={(value) => updateAttendance(record.studentId, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUSES.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Attendance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Attendance trend analytics will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
