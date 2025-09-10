'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Target,
  Gauge
} from 'lucide-react';

interface ScalabilityTest {
  id: string;
  testName: string;
  testType: 'load_testing' | 'stress_testing' | 'spike_testing' | 'volume_testing' | 'endurance_testing' | 'capacity_testing';
  description: string;
  targetConcurrentUsers: number;
  testDuration: number;
  testConfiguration: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  results?: any;
  performanceMetrics?: any;
  bottlenecks?: any;
  recommendations?: any;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  loadTests: LoadTest[];
  _count: {
    loadTests: number;
  };
}

interface LoadTest {
  id: string;
  testPhase: string;
  concurrentUsers: number;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
  networkLatency: number;
  timestamp: string;
  metadata?: any;
}

interface PerformanceBenchmark {
  id: string;
  benchmarkName: string;
  benchmarkType: 'response_time' | 'throughput' | 'resource_utilization' | 'database_performance' | 'cache_performance' | 'api_performance' | 'user_experience';
  description: string;
  targetMetrics: any;
  actualMetrics: any;
  performanceScore: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'baseline' | 'comparison';
  baselineDate: string;
  comparisonDate?: string;
  improvements?: any;
  regressions?: any;
  recommendations?: any;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface SystemResource {
  id: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'cache' | 'api_endpoint' | 'queue';
  resourceName: string;
  currentUsage: number;
  maxCapacity: number;
  utilizationPercentage: number;
  status: 'healthy' | 'warning' | 'critical' | 'overloaded' | 'offline';
  alerts?: any;
  metrics: any;
  timestamp: string;
}

const testTypeIcons = {
  load_testing: Users,
  stress_testing: Zap,
  spike_testing: TrendingUp,
  volume_testing: Database,
  endurance_testing: Clock,
  capacity_testing: Target,
} as const;

const testTypeColors = {
  load_testing: 'default',
  stress_testing: 'destructive',
  spike_testing: 'secondary',
  volume_testing: 'default',
  endurance_testing: 'secondary',
  capacity_testing: 'default',
} as const;

const statusColors = {
  pending: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'outline',
} as const;

const resourceTypeIcons = {
  cpu: Cpu,
  memory: Activity,
  disk: HardDrive,
  network: Wifi,
  database: Database,
  cache: Server,
  api_endpoint: Zap,
  queue: Clock,
} as const;

const resourceStatusColors = {
  healthy: 'default',
  warning: 'secondary',
  critical: 'destructive',
  overloaded: 'destructive',
  offline: 'outline',
} as const;

export default function ScalabilityTestingDashboard() {
  const [tests, setTests] = useState<ScalabilityTest[]>([]);
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([]);
  const [resources, setResources] = useState<SystemResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTest, setSelectedTest] = useState<ScalabilityTest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    testType: 'all',
    status: 'all',
    search: '',
  });
  const [newTest, setNewTest] = useState({
    testName: '',
    testType: 'load_testing' as const,
    description: '',
    targetConcurrentUsers: 100,
    testDuration: 30,
    testConfiguration: {},
  });

  useEffect(() => {
    fetchTests();
    fetchBenchmarks();
    fetchResources();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scalability/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const response = await fetch('/api/scalability/benchmarks');
      if (response.ok) {
        const data = await response.json();
        setBenchmarks(data.benchmarks);
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/scalability/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleTestSelect = (test: ScalabilityTest) => {
    setSelectedTest(test);
  };

  const handleCreateTest = async () => {
    try {
      const response = await fetch('/api/scalability/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTest),
      });

      if (response.ok) {
        await fetchTests();
        setIsCreateDialogOpen(false);
        setNewTest({
          testName: '',
          testType: 'load_testing',
          description: '',
          targetConcurrentUsers: 100,
          testDuration: 30,
          testConfiguration: {},
        });
      }
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const filteredTests = tests.filter(test => {
    if (filters.testType !== 'all' && test.testType !== filters.testType) return false;
    if (filters.status !== 'all' && test.status !== filters.status) return false;
    if (filters.search && !test.testName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getTestStats = () => {
    const total = tests.length;
    const running = tests.filter(t => t.status === 'running').length;
    const completed = tests.filter(t => t.status === 'completed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const maxUsers = Math.max(...tests.map(t => t.targetConcurrentUsers), 0);

    return { total, running, completed, failed, maxUsers };
  };

  const getResourceStats = () => {
    const total = resources.length;
    const healthy = resources.filter(r => r.status === 'healthy').length;
    const warning = resources.filter(r => r.status === 'warning').length;
    const critical = resources.filter(r => r.status === 'critical' || r.status === 'overloaded').length;
    const avgUtilization = total > 0 ? resources.reduce((sum, r) => sum + r.utilizationPercentage, 0) / total : 0;

    return { total, healthy, warning, critical, avgUtilization };
  };

  const stats = getTestStats();
  const resourceStats = getResourceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scalability testing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scalability Testing</h1>
          <p className="text-muted-foreground">
            Load testing for 1,000+ concurrent students and performance optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Scalability tests conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Concurrent Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.maxUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Highest load tested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(resourceStats.avgUtilization)}%</div>
            <p className="text-xs text-muted-foreground">
              Average resource utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Load Tests</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="resources">System Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tests</CardTitle>
                <CardDescription>
                  Latest scalability tests and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.slice(0, 5).map((test) => {
                    const IconComponent = testTypeIcons[test.testType];
                    return (
                      <div
                        key={test.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTest?.id === test.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleTestSelect(test)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <Badge variant={testTypeColors[test.testType]}>
                              {test.testType.replace('_', ' ')}
                            </Badge>
                            <Badge variant={statusColors[test.status]}>
                              {test.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(test.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{test.testName}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>{test.targetConcurrentUsers.toLocaleString()} users</span>
                            <span>{test.testDuration} min</span>
                            <span>{test._count.loadTests} data points</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {test.creator.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* System Resources Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>
                  Current system resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.slice(0, 8).map((resource) => {
                    const IconComponent = resourceTypeIcons[resource.resourceType];
                    return (
                      <div key={resource.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium">{resource.resourceName}</span>
                            <Badge variant={resourceStatusColors[resource.status]}>
                              {resource.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {resource.utilizationPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={resource.utilizationPercentage} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>{resource.currentUsage.toFixed(1)} / {resource.maxCapacity.toFixed(1)}</span>
                          <span>{resource.resourceType}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.testType}
                onValueChange={(value) => setFilters({ ...filters, testType: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Test Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="load_testing">Load Testing</SelectItem>
                  <SelectItem value="stress_testing">Stress Testing</SelectItem>
                  <SelectItem value="spike_testing">Spike Testing</SelectItem>
                  <SelectItem value="volume_testing">Volume Testing</SelectItem>
                  <SelectItem value="endurance_testing">Endurance Testing</SelectItem>
                  <SelectItem value="capacity_testing">Capacity Testing</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tests Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first scalability test.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Test
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTests.map((test) => {
                const IconComponent = testTypeIcons[test.testType];
                return (
                  <Card key={test.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={testTypeColors[test.testType]}>
                            {test.testType.replace('_', ' ')}
                          </Badge>
                          <Badge variant={statusColors[test.status]}>
                            {test.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{test.testName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Target Users</Label>
                          <p className="text-muted-foreground">{test.targetConcurrentUsers.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Duration</Label>
                          <p className="text-muted-foreground">{test.testDuration} minutes</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created by:</span>
                          <span>{test.creator.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Data points:</span>
                          <span>{test._count.loadTests}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Performance Benchmarks</h3>
              <p className="text-muted-foreground mb-4">
                Track and compare performance metrics over time.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Benchmark
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4">
            {resources.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Resource Data</h3>
                  <p className="text-muted-foreground mb-4">
                    System resource monitoring data will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              resources.map((resource) => {
                const IconComponent = resourceTypeIcons[resource.resourceType];
                return (
                  <Card key={resource.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={resourceStatusColors[resource.status]}>
                            {resource.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(resource.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{resource.resourceName}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Current Usage</Label>
                          <p className="text-muted-foreground">{resource.currentUsage.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Max Capacity</Label>
                          <p className="text-muted-foreground">{resource.maxCapacity.toFixed(2)}</p>
                        </div>
                      </div>
                      <Progress value={resource.utilizationPercentage} className="mt-2" />
                      <div className="mt-2 text-sm text-muted-foreground">
                        {resource.utilizationPercentage.toFixed(1)}% utilization
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Scalability Test</DialogTitle>
            <DialogDescription>
              Create a new scalability test for load testing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testType">Test Type</Label>
                <Select
                  value={newTest.testType}
                  onValueChange={(value: any) => setNewTest({ ...newTest, testType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="load_testing">Load Testing</SelectItem>
                    <SelectItem value="stress_testing">Stress Testing</SelectItem>
                    <SelectItem value="spike_testing">Spike Testing</SelectItem>
                    <SelectItem value="volume_testing">Volume Testing</SelectItem>
                    <SelectItem value="endurance_testing">Endurance Testing</SelectItem>
                    <SelectItem value="capacity_testing">Capacity Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetConcurrentUsers">Target Concurrent Users</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTest.targetConcurrentUsers}
                  onChange={(e) => setNewTest({ ...newTest, targetConcurrentUsers: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="testName">Test Name</Label>
              <Input
                value={newTest.testName}
                onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                placeholder="Enter test name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Describe the test"
              />
            </div>
            <div>
              <Label htmlFor="testDuration">Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={newTest.testDuration}
                onChange={(e) => setNewTest({ ...newTest, testDuration: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest}>Create Test</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
