import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  //Calendar,
  //Clock,
  //Target,
  Award,
  Activity,
  BarChart3,
  MessageSquare,
  Eye
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Children | AI Teacher',
  description: 'View and manage your children\'s learning progress and activities',
};

// Mock data - in real app this would come from API
const children = [
  {
    id: '1',
    name: 'Sarah Johnson',
    grade: '5th Grade',
    avatar: '/avatars/sarah.jpg',
    currentSubject: 'Mathematics',
    progress: 78,
    lastActive: '2 hours ago',
    achievements: 12,
    weeklyGoal: 85,
    status: 'active',
    courses: [
      { name: 'Mathematics', progress: 78, color: 'bg-blue-500' },
      { name: 'Science', progress: 65, color: 'bg-green-500' },
      { name: 'English', progress: 82, color: 'bg-purple-500' },
    ],
    recentActivity: [
      { type: 'assessment', subject: 'Math', score: 85, time: '1 hour ago' },
      { type: 'lesson', subject: 'Science', topic: 'Photosynthesis', time: '3 hours ago' },
      { type: 'achievement', title: 'Math Master', time: 'Yesterday' },
    ]
  },
  {
    id: '2',
    name: 'Michael Johnson',
    grade: '3rd Grade',
    avatar: '/avatars/michael.jpg',
    currentSubject: 'Science',
    progress: 92,
    lastActive: '30 minutes ago',
    achievements: 8,
    weeklyGoal: 90,
    status: 'active',
    courses: [
      { name: 'Mathematics', progress: 88, color: 'bg-blue-500' },
      { name: 'Science', progress: 92, color: 'bg-green-500' },
      { name: 'English', progress: 76, color: 'bg-purple-500' },
    ],
    recentActivity: [
      { type: 'lesson', subject: 'Science', topic: 'Solar System', time: '30 minutes ago' },
      { type: 'assessment', subject: 'Math', score: 92, time: '2 hours ago' },
      { type: 'achievement', title: 'Science Explorer', time: '2 days ago' },
    ]
  }
];

export default function MyChildrenPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground">
            Monitor your children&#39;s learning progress and activities
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={child.avatar} alt={child.name} />
                    <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{child.name}</CardTitle>
                    <CardDescription>{child.grade}</CardDescription>
                  </div>
                </div>
                <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                  {child.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Progress Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{child.progress}%</span>
                </div>
                <Progress value={child.progress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Weekly Goal: {child.weeklyGoal}%</span>
                  <span>Last active: {child.lastActive}</span>
                </div>
              </div>

              {/* Current Subject */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Currently Learning:</span>
                  <span className="text-sm text-blue-600">{child.currentSubject}</span>
                </div>
              </div>

              {/* Course Progress */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Course Progress</h4>
                <div className="space-y-2">
                  {child.courses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${course.color}`}></div>
                        <span className="text-sm">{course.name}</span>
                      </div>
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Achievements</span>
                </div>
                <span className="text-sm font-bold text-amber-600">{child.achievements}</span>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Activity</h4>
                <div className="space-y-2">
                  {child.recentActivity.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {activity.type === 'assessment' && <BarChart3 className="h-3 w-3 text-green-600" />}
                        {activity.type === 'lesson' && <BookOpen className="h-3 w-3 text-blue-600" />}
                        {activity.type === 'achievement' && <Award className="h-3 w-3 text-amber-600" />}
                        <span>
                          {activity.type === 'assessment' && `Scored ${activity.score}% in ${activity.subject}`}
                          {activity.type === 'lesson' && `Completed ${activity.topic} in ${activity.subject}`}
                          {activity.type === 'achievement' && `Earned ${activity.title}`}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
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
                  {Math.round(children.reduce((sum, child) => sum + child.progress, 0) / children.length)}%
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
                  {children.reduce((sum, child) => sum + child.achievements, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Active Today</p>
                <p className="text-2xl font-bold">{children.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
