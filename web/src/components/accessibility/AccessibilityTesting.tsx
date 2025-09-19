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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
//import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  //Clock, 
  Eye, 
  Keyboard,
  Volume2,
  Palette,
  MousePointer,
  User,
  Users,
  Plus,
  //Filter,
  Search,
  Play,
  Download,
  //Upload,
  BarChart3
} from 'lucide-react';

interface AccessibilityTest {
  id: string;
  testType: 'automated' | 'manual' | 'user_testing' | 'screen_reader_testing' | 'keyboard_testing' | 'color_contrast_testing';
  testName: string;
  description: string;
  testUrl: string;
  testResults: any;
  passed: boolean;
  score: number;
  issues?: any;
  recommendations?: any;
  testDate: string;
  tester: {
    id: string;
    name: string;
    email: string;
  };
}

const testTypeIcons = {
  automated: TestTube,
  manual: User,
  user_testing: Users,
  screen_reader_testing: Volume2,
  keyboard_testing: Keyboard,
  color_contrast_testing: Palette,
} as const;

const testTypeColors = {
  automated: 'default',
  manual: 'secondary',
  user_testing: 'default',
  screen_reader_testing: 'default',
  keyboard_testing: 'default',
  color_contrast_testing: 'default',
} as const;

export default function AccessibilityTesting() {
  const [tests, setTests] = useState<AccessibilityTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    testType: 'all',
    passed: 'all',
    search: '',
  });
  const [newTest, setNewTest] = useState({
    testType: 'automated' as const,
    testName: '',
    description: '',
    testUrl: '',
    testResults: {},
    passed: false,
    score: 0,
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accessibility/tests');
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

  const handleCreateTest = async () => {
    try {
      const response = await fetch('/api/accessibility/tests', {
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
          testType: 'automated',
          testName: '',
          description: '',
          testUrl: '',
          testResults: {},
          passed: false,
          score: 0,
        });
      }
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const filteredTests = tests.filter(test => {
    if (filters.testType !== 'all' && test.testType !== filters.testType) return false;
    if (filters.passed !== 'all' && test.passed.toString() !== filters.passed) return false;
    if (filters.search && !test.testName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getTestStats = () => {
    const total = tests.length;
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const avgScore = total > 0 ? tests.reduce((sum, t) => sum + t.score, 0) / total : 0;

    return { total, passed, failed, avgScore };
  };

  const stats = getTestStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accessibility tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Testing</h1>
          <p className="text-muted-foreground">
            Conduct and manage accessibility tests for WCAG compliance
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
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Accessibility tests conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Tests requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall test performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          <TabsTrigger value="user-testing">User Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                  <SelectItem value="automated">Automated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="user_testing">User Testing</SelectItem>
                  <SelectItem value="screen_reader_testing">Screen Reader</SelectItem>
                  <SelectItem value="keyboard_testing">Keyboard</SelectItem>
                  <SelectItem value="color_contrast_testing">Color Contrast</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.passed}
                onValueChange={(value) => setFilters({ ...filters, passed: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="true">Passed</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tests Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by conducting your first accessibility test.
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
                          <Badge variant={test.passed ? 'default' : 'destructive'}>
                            {test.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{test.testName}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Test URL</Label>
                          <p className="text-muted-foreground truncate">{test.testUrl}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Score</Label>
                          <p className="text-muted-foreground">{test.score}%</p>
                        </div>
                      </div>
                      <Progress value={test.score} className="mt-2" />
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tested by:</span>
                          <span>{test.tester.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(test.testDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Testing Tools</CardTitle>
              <CardDescription>
                Run automated accessibility tests using various tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-5 w-5" />
                      <h4 className="font-semibold">axe-core</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automated accessibility testing with comprehensive WCAG coverage
                    </p>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5" />
                      <h4 className="font-semibold">WAVE</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Web accessibility evaluation with visual feedback
                    </p>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="h-5 w-5" />
                      <h4 className="font-semibold">Color Contrast</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test color contrast ratios for WCAG compliance
                    </p>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Keyboard className="h-5 w-5" />
                      <h4 className="font-semibold">Keyboard Navigation</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test keyboard accessibility and focus management
                    </p>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Testing Checklist</CardTitle>
              <CardDescription>
                Comprehensive manual accessibility testing checklist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">All interactive elements are keyboard accessible</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Focus indicators are visible and clear</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Tab order is logical and intuitive</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">No keyboard traps exist</span>
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Screen Reader Testing</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">All images have appropriate alt text</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Form labels are properly associated</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Headings are properly structured</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">ARIA labels and roles are used correctly</span>
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Visual Accessibility</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Color contrast meets WCAG AA standards</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Text can be resized up to 200%</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Information is not conveyed by color alone</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Content is readable in high contrast mode</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Testing</CardTitle>
              <CardDescription>
                Conduct accessibility testing with real users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-5 w-5" />
                      <h4 className="font-semibold">Screen Reader Users</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test with users who rely on screen readers
                    </p>
                    <Button size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Schedule Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Keyboard className="h-5 w-5" />
                      <h4 className="font-semibold">Keyboard Users</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test with users who navigate using only keyboard
                    </p>
                    <Button size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Schedule Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5" />
                      <h4 className="font-semibold">Low Vision Users</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test with users who have visual impairments
                    </p>
                    <Button size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Schedule Test
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointer className="h-5 w-5" />
                      <h4 className="font-semibold">Motor Impairment Users</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test with users who have motor impairments
                    </p>
                    <Button size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Schedule Test
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Accessibility Test</DialogTitle>
            <DialogDescription>
              Create a new accessibility test record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  <SelectItem value="automated">Automated</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="user_testing">User Testing</SelectItem>
                  <SelectItem value="screen_reader_testing">Screen Reader Testing</SelectItem>
                  <SelectItem value="keyboard_testing">Keyboard Testing</SelectItem>
                  <SelectItem value="color_contrast_testing">Color Contrast Testing</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="testUrl">Test URL</Label>
              <Input
                value={newTest.testUrl}
                onChange={(e) => setNewTest({ ...newTest, testUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="score">Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newTest.score}
                  onChange={(e) => setNewTest({ ...newTest, score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="passed"
                  checked={newTest.passed}
                  onChange={(e) => setNewTest({ ...newTest, passed: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="passed">Test Passed</Label>
              </div>
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
