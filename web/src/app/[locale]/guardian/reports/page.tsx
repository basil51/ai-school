import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Eye,
  Users,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Award,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Progress Reports | AI Teacher',
  description: 'View detailed progress reports and analytics for your children',
};

// Mock data - in real app this would come from API
const children = [
  {
    id: '1',
    name: 'Sarah Johnson',
    grade: '5th Grade',
    overallProgress: 78,
    weeklyProgress: 5,
    monthlyProgress: 12,
    subjects: [
      { name: 'Mathematics', progress: 78, trend: 'up', lastScore: 85, averageScore: 82 },
      { name: 'Science', progress: 65, trend: 'up', lastScore: 78, averageScore: 70 },
      { name: 'English', progress: 82, trend: 'stable', lastScore: 80, averageScore: 79 },
    ],
    achievements: [
      { title: 'Math Master', date: '2024-01-15', type: 'academic' },
      { title: 'Science Explorer', date: '2024-01-10', type: 'exploration' },
      { title: 'Reading Champion', date: '2024-01-08', type: 'reading' },
    ],
    weeklyGoals: [
      { subject: 'Mathematics', target: 80, current: 78, status: 'on_track' },
      { subject: 'Science', target: 70, current: 65, status: 'needs_attention' },
      { subject: 'English', target: 85, current: 82, status: 'on_track' },
    ],
    recentAssessments: [
      { subject: 'Mathematics', score: 85, date: '2024-01-20', type: 'quiz' },
      { subject: 'Science', score: 78, date: '2024-01-18', type: 'test' },
      { subject: 'English', score: 80, date: '2024-01-15', type: 'assignment' },
    ]
  },
  {
    id: '2',
    name: 'Michael Johnson',
    grade: '3rd Grade',
    overallProgress: 92,
    weeklyProgress: 8,
    monthlyProgress: 18,
    subjects: [
      { name: 'Mathematics', progress: 88, trend: 'up', lastScore: 92, averageScore: 85 },
      { name: 'Science', progress: 92, trend: 'up', lastScore: 95, averageScore: 88 },
      { name: 'English', progress: 76, trend: 'down', lastScore: 72, averageScore: 78 },
    ],
    achievements: [
      { title: 'Math Wizard', date: '2024-01-18', type: 'academic' },
      { title: 'Science Star', date: '2024-01-12', type: 'exploration' },
      { title: 'Problem Solver', date: '2024-01-05', type: 'critical_thinking' },
    ],
    weeklyGoals: [
      { subject: 'Mathematics', target: 90, current: 88, status: 'on_track' },
      { subject: 'Science', target: 95, current: 92, status: 'on_track' },
      { subject: 'English', target: 80, current: 76, status: 'needs_attention' },
    ],
    recentAssessments: [
      { subject: 'Mathematics', score: 92, date: '2024-01-19', type: 'quiz' },
      { subject: 'Science', score: 95, date: '2024-01-17', type: 'test' },
      { subject: 'English', score: 72, date: '2024-01-14', type: 'assignment' },
    ]
  }
];

export default function ProgressReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Reports</h1>
          <p className="text-muted-foreground">
            Detailed analytics and progress tracking for your children
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              <SelectItem value="sarah">Sarah Johnson</SelectItem>
              <SelectItem value="michael">Michael Johnson</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Children</p>
                <p className="text-2xl font-bold">{children.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(children.reduce((sum, child) => sum + child.overallProgress, 0) / children.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Total Achievements</p>
                <p className="text-2xl font-bold">
                  {children.reduce((sum, child) => sum + child.achievements.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Goals Met</p>
                <p className="text-2xl font-bold">
                  {children.reduce((sum, child) => 
                    sum + child.weeklyGoals.filter(goal => goal.status === 'on_track').length, 0
                  )}/{children.reduce((sum, child) => sum + child.weeklyGoals.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{child.name}</CardTitle>
                      <CardDescription>{child.grade}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{child.overallProgress}%</div>
                      <div className="text-sm text-muted-foreground">Overall Progress</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress value={child.overallProgress} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Weekly: +{child.weeklyProgress}%</span>
                        <span>Monthly: +{child.monthlyProgress}%</span>
                      </div>
                    </div>

                    {/* Subject Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {child.subjects.map((subject, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{subject.name}</span>
                            <div className="flex items-center space-x-1">
                              {subject.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                              {subject.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                              {subject.trend === 'stable' && <Activity className="h-3 w-3 text-blue-600" />}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{subject.progress}%</span>
                            </div>
                            <Progress value={subject.progress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Last: {subject.lastScore}%</span>
                              <span>Avg: {subject.averageScore}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle>{child.name} - Detailed Report</CardTitle>
                  <CardDescription>Comprehensive progress analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Recent Assessments */}
                    <div>
                      <h4 className="font-medium mb-3">Recent Assessments</h4>
                      <div className="space-y-2">
                        {child.recentAssessments.map((assessment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{assessment.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  {assessment.type} • {assessment.date}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{assessment.score}%</div>
                              <Badge variant={assessment.score >= 80 ? 'default' : assessment.score >= 60 ? 'secondary' : 'destructive'}>
                                {assessment.score >= 80 ? 'Excellent' : assessment.score >= 60 ? 'Good' : 'Needs Improvement'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Goals Status */}
                    <div>
                      <h4 className="font-medium mb-3">Weekly Goals Status</h4>
                      <div className="space-y-2">
                        {child.weeklyGoals.map((goal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                goal.status === 'on_track' ? 'bg-green-100' : 
                                goal.status === 'needs_attention' ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                {goal.status === 'on_track' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {goal.status === 'needs_attention' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                                {goal.status === 'behind' && <AlertCircle className="h-4 w-4 text-red-600" />}
                              </div>
                              <div>
                                <div className="font-medium">{goal.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  Target: {goal.target}% • Current: {goal.current}%
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{goal.current}%</div>
                              <Badge variant={
                                goal.status === 'on_track' ? 'default' : 
                                goal.status === 'needs_attention' ? 'secondary' : 'destructive'
                              }>
                                {goal.status === 'on_track' ? 'On Track' : 
                                 goal.status === 'needs_attention' ? 'Needs Attention' : 'Behind'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle>{child.name} - Achievements</CardTitle>
                  <CardDescription>Recent accomplishments and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {child.achievements.map((achievement, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Award className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.type} • {achievement.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle>{child.name} - Goals & Targets</CardTitle>
                  <CardDescription>Weekly and monthly learning objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {child.weeklyGoals.map((goal, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{goal.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              Weekly Target: {goal.target}%
                            </div>
                          </div>
                          <Badge variant={
                            goal.status === 'on_track' ? 'default' : 
                            goal.status === 'needs_attention' ? 'secondary' : 'destructive'
                          }>
                            {goal.status === 'on_track' ? 'On Track' : 
                             goal.status === 'needs_attention' ? 'Needs Attention' : 'Behind'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.current}% / {goal.target}%</span>
                          </div>
                          <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
