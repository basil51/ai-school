import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard';
import LearningInsightsDashboard from '@/components/analytics/LearningInsightsDashboard';
import GuardianInsightsDashboard from '@/components/analytics/GuardianInsightsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Brain, 
  Users, 
  TrendingUp,
  Target,
  Lightbulb,
  BookOpen,
  Activity
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advanced Analytics & Reporting',
  description: 'Comprehensive learning analytics and insights dashboard',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has permission to access analytics
  if (!['admin', 'teacher', 'super_admin', 'guardian'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced Analytics & Reporting
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive learning insights, performance analytics, and AI-powered recommendations 
          to optimize educational outcomes and support student success.
        </p>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Performance Analytics</CardTitle>
            <CardDescription>
              Comprehensive KPI tracking and performance metrics
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <Brain className="h-12 w-12 mx-auto text-purple-600 mb-2" />
            <CardTitle className="text-lg">Learning Patterns</CardTitle>
            <CardDescription>
              AI-powered analysis of individual learning styles
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">Learning Curves</CardTitle>
            <CardDescription>
              Track progress and identify learning plateaus
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto text-orange-600 mb-2" />
            <CardTitle className="text-lg">Guardian Insights</CardTitle>
            <CardDescription>
              Actionable recommendations for parents and guardians
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Analytics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Learning Insights
          </TabsTrigger>
          <TabsTrigger value="guardian" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Guardian Insights
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <LearningInsightsDashboard />
        </TabsContent>

        <TabsContent value="guardian" className="space-y-6">
          <GuardianInsightsDashboard />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Learning Pattern Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        AI-powered analysis of individual learning styles, strengths, and preferences
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Knowledge Retention Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        Spaced repetition and forgetting curve analysis for optimal review scheduling
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Engagement Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Real-time engagement monitoring and content adjustment recommendations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Performance KPIs</h4>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive metrics tracking mastery, completion, and engagement rates
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Guardian Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        AI-generated actionable recommendations for parents and guardians
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Personalized Learning</h4>
                      <p className="text-sm text-muted-foreground">
                        Adapt teaching methods based on individual learning patterns and preferences
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Early Intervention</h4>
                      <p className="text-sm text-muted-foreground">
                        Identify struggling students early and provide targeted support
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Data-Driven Decisions</h4>
                      <p className="text-sm text-muted-foreground">
                        Make informed decisions based on comprehensive analytics and insights
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Parent Engagement</h4>
                      <p className="text-sm text-muted-foreground">
                        Keep parents informed and engaged with actionable insights and recommendations
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Continuous Improvement</h4>
                      <p className="text-sm text-muted-foreground">
                        Continuously optimize learning experiences based on performance data
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Technical Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">AI-Powered Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Advanced machine learning algorithms for pattern recognition and prediction
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Real-Time Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Live data processing and instant insights generation
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Scalable Architecture</h4>
                      <p className="text-sm text-muted-foreground">
                        Built to handle large-scale educational data and multiple institutions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Privacy & Security</h4>
                      <p className="text-sm text-muted-foreground">
                        COPPA and GDPR compliant with enterprise-grade security
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium">Explore Overview Dashboard</h4>
                      <p className="text-sm text-muted-foreground">
                        Start with the overview tab to see high-level analytics and insights
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium">Analyze Learning Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Dive deep into learning patterns, curves, and retention analysis
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium">Review Guardian Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Check AI-generated recommendations for parents and guardians
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium">Take Action</h4>
                      <p className="text-sm text-muted-foreground">
                        Implement recommendations and track their effectiveness over time
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
