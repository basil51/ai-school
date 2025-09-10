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
  BookOpen, 
  Users, 
  Clock, 
  Award,
  Play,
  CheckCircle,
  Star,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  GraduationCap,
  Target,
  Bookmark
} from 'lucide-react';

interface AccessibilityTraining {
  id: string;
  trainingType: 'general_accessibility' | 'wcag_guidelines' | 'screen_reader_usage' | 'keyboard_navigation' | 'color_contrast' | 'aria_implementation' | 'testing_methodologies';
  title: string;
  description: string;
  content: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites?: string;
  learningObjectives: string[];
  resources: string[];
  assessment?: string;
  completionCriteria: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    completions: number;
  };
}

interface TrainingCompletion {
  id: string;
  trainingId: string;
  userId: string;
  completedAt: string;
  score?: number;
  feedback?: string;
  certificateUrl?: string;
  training: {
    id: string;
    title: string;
    trainingType: string;
    difficulty: string;
    duration: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const trainingTypeIcons = {
  general_accessibility: BookOpen,
  wcag_guidelines: BookOpen,
  screen_reader_usage: Users,
  keyboard_navigation: Users,
  color_contrast: Users,
  aria_implementation: Users,
  testing_methodologies: Users,
} as const;

const difficultyColors = {
  beginner: 'default',
  intermediate: 'secondary',
  advanced: 'default',
  expert: 'destructive',
} as const;

export default function AccessibilityTraining() {
  const [training, setTraining] = useState<AccessibilityTraining[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    trainingType: 'all',
    difficulty: 'all',
    isActive: 'all',
    search: '',
  });
  const [newTraining, setNewTraining] = useState({
    trainingType: 'general_accessibility' as const,
    title: '',
    description: '',
    content: '',
    duration: 30,
    difficulty: 'beginner' as const,
    prerequisites: '',
    learningObjectives: [''],
    resources: [''],
    assessment: '',
    completionCriteria: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTraining();
    fetchCompletions();
  }, []);

  const fetchTraining = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accessibility/training');
      if (response.ok) {
        const data = await response.json();
        setTraining(data.training);
      }
    } catch (error) {
      console.error('Error fetching training:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletions = async () => {
    try {
      const response = await fetch('/api/accessibility/training/completions');
      if (response.ok) {
        const data = await response.json();
        setCompletions(data.completions);
      }
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const handleCreateTraining = async () => {
    try {
      const response = await fetch('/api/accessibility/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTraining),
      });

      if (response.ok) {
        await fetchTraining();
        setIsCreateDialogOpen(false);
        setNewTraining({
          trainingType: 'general_accessibility',
          title: '',
          description: '',
          content: '',
          duration: 30,
          difficulty: 'beginner',
          prerequisites: '',
          learningObjectives: [''],
          resources: [''],
          assessment: '',
          completionCriteria: '',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error creating training:', error);
    }
  };

  const filteredTraining = training.filter(t => {
    if (filters.trainingType !== 'all' && t.trainingType !== filters.trainingType) return false;
    if (filters.difficulty !== 'all' && t.difficulty !== filters.difficulty) return false;
    if (filters.isActive !== 'all' && t.isActive.toString() !== filters.isActive) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getTrainingStats = () => {
    const total = training.length;
    const active = training.filter(t => t.isActive).length;
    const totalCompletions = completions.length;
    const avgScore = completions.length > 0 
      ? completions.filter(c => c.score).reduce((sum, c) => sum + (c.score || 0), 0) / completions.filter(c => c.score).length 
      : 0;

    return { total, active, totalCompletions, avgScore };
  };

  const stats = getTrainingStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accessibility training...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Training</h1>
          <p className="text-muted-foreground">
            Manage accessibility training programs and track completion
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Training
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Training programs available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently available for enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Training completions recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall training performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
          <TabsTrigger value="completions">Completions</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Training Programs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Training Programs</CardTitle>
                <CardDescription>
                  Latest accessibility training programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {training.slice(0, 5).map((program) => {
                    const IconComponent = trainingTypeIcons[program.trainingType];
                    return (
                      <div key={program.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <Badge variant={difficultyColors[program.difficulty]}>
                              {program.difficulty}
                            </Badge>
                            <Badge variant={program.isActive ? 'default' : 'secondary'}>
                              {program.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {program._count.completions} completions
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{program.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{program.description}</p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {program.duration} min
                            </span>
                            <span>{program.trainingType.replace('_', ' ')}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Completions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Completions</CardTitle>
                <CardDescription>
                  Latest training completions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completions.slice(0, 5).map((completion) => (
                    <div key={completion.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge variant="outline">
                            {completion.training.difficulty}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(completion.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-1">{completion.training.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Completed by {completion.user.name}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {completion.training.duration} min
                          </span>
                          {completion.score && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {completion.score}%
                            </span>
                          )}
                        </div>
                        {completion.certificateUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search training programs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.trainingType}
                onValueChange={(value) => setFilters({ ...filters, trainingType: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general_accessibility">General</SelectItem>
                  <SelectItem value="wcag_guidelines">WCAG Guidelines</SelectItem>
                  <SelectItem value="screen_reader_usage">Screen Reader</SelectItem>
                  <SelectItem value="keyboard_navigation">Keyboard</SelectItem>
                  <SelectItem value="color_contrast">Color Contrast</SelectItem>
                  <SelectItem value="aria_implementation">ARIA</SelectItem>
                  <SelectItem value="testing_methodologies">Testing</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => setFilters({ ...filters, difficulty: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTraining.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Training Programs</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first accessibility training program.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Program
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTraining.map((program) => {
                const IconComponent = trainingTypeIcons[program.trainingType];
                return (
                  <Card key={program.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <Badge variant={difficultyColors[program.difficulty]}>
                            {program.difficulty}
                          </Badge>
                          <Badge variant={program.isActive ? 'default' : 'secondary'}>
                            {program.isActive ? 'Active' : 'Inactive'}
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
                      <h4 className="font-semibold mb-2">{program.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Duration</Label>
                          <p className="text-muted-foreground">{program.duration} minutes</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Completions</Label>
                          <p className="text-muted-foreground">{program._count.completions}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{program.trainingType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search completions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {completions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Training completions will appear here once users complete programs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completions.map((completion) => (
                <Card key={completion.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="outline">
                          {completion.training.difficulty}
                        </Badge>
                        {completion.score && (
                          <Badge variant="default">
                            {completion.score}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {completion.certificateUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{completion.training.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Completed by {completion.user.name}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">Completion Date</Label>
                        <p className="text-muted-foreground">
                          {new Date(completion.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Duration</Label>
                        <p className="text-muted-foreground">{completion.training.duration} minutes</p>
                      </div>
                    </div>
                    {completion.feedback && (
                      <div className="mt-3 pt-3 border-t">
                        <Label className="text-xs font-medium">Feedback</Label>
                        <p className="text-sm text-muted-foreground mt-1">{completion.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Certificate Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage training certificates and digital badges.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Certificate Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Training Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Program</DialogTitle>
            <DialogDescription>
              Create a new accessibility training program
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trainingType">Training Type</Label>
                <Select
                  value={newTraining.trainingType}
                  onValueChange={(value: any) => setNewTraining({ ...newTraining, trainingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_accessibility">General Accessibility</SelectItem>
                    <SelectItem value="wcag_guidelines">WCAG Guidelines</SelectItem>
                    <SelectItem value="screen_reader_usage">Screen Reader Usage</SelectItem>
                    <SelectItem value="keyboard_navigation">Keyboard Navigation</SelectItem>
                    <SelectItem value="color_contrast">Color Contrast</SelectItem>
                    <SelectItem value="aria_implementation">ARIA Implementation</SelectItem>
                    <SelectItem value="testing_methodologies">Testing Methodologies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={newTraining.difficulty}
                  onValueChange={(value: any) => setNewTraining({ ...newTraining, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                value={newTraining.title}
                onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                placeholder="Enter training title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={newTraining.description}
                onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                placeholder="Describe the training program"
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                value={newTraining.content}
                onChange={(e) => setNewTraining({ ...newTraining, content: e.target.value })}
                placeholder="Enter training content"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newTraining.duration}
                  onChange={(e) => setNewTraining({ ...newTraining, duration: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newTraining.isActive}
                  onChange={(e) => setNewTraining({ ...newTraining, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="prerequisites">Prerequisites</Label>
              <Input
                value={newTraining.prerequisites}
                onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                placeholder="Enter prerequisites"
              />
            </div>
            <div>
              <Label htmlFor="completionCriteria">Completion Criteria</Label>
              <Textarea
                value={newTraining.completionCriteria}
                onChange={(e) => setNewTraining({ ...newTraining, completionCriteria: e.target.value })}
                placeholder="Describe completion criteria"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTraining}>Create Training</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
