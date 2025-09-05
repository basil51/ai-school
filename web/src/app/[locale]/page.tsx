// app/[locale]/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BrainCircuit,
  Target,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Shield,
  Star,
  PlayCircle,
  TrendingUp,
  Clock,
  Award,
  Heart,
  Lightbulb
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Teacher - The Future of Personalized Learning',
  description: 'Revolutionary AI Teacher that adapts to every student\'s unique learning style, ensures mastery through continuous assessment, and transforms education worldwide.',
  keywords: ['AI education', 'personalized learning', 'adaptive teaching', 'online tutoring', 'AI teacher'],
  openGraph: {
    title: 'AI Teacher - The Future of Personalized Learning',
    description: 'Revolutionary AI Teacher that adapts to every student\'s unique learning style, ensures mastery through continuous assessment, and transforms education worldwide.',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20 max-w-6xl">
          <div className="text-center space-y-8">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              The Future of
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Personalized Learning
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Revolutionary AI Teacher that adapts to every student&apos;s unique learning style, 
              ensures mastery through continuous assessment, and transforms education worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 h-auto">
                <Link href="/login" className="flex items-center gap-2">
                  Start Learning Today
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 h-auto">
                <Link href="/demo">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Watch Demo
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Free to Start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No Credit Card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Instant Access
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">50K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Active Students</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-purple-600">2M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Lessons Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-orange-600">150+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose AI Teacher?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Revolutionary features that make learning effective and enjoyable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Adaptive AI Teaching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our AI adapts to your learning style, pace, and preferences. 
                  Every lesson is personalized just for you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Mastery-Based Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Progress only after truly understanding concepts. Our system ensures 
                  you master each topic before moving forward.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your progress with detailed analytics. See your strengths, 
                  identify areas for improvement, and celebrate achievements.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Rich Content Library</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access thousands of lessons across multiple subjects. From mathematics 
                  to science, we cover all educational levels.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle>Collaborative Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with peers, join study groups, and get help from teachers. 
                  Learning is better together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Privacy-first design with COPPA and GDPR compliance. 
                  Your data is protected with enterprise-grade security.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Tailored experiences for each type of user
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Personalized AI tutoring and adaptive learning paths
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Curriculum management and student progress tracking
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Complete school management and analytics dashboard
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Parents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Monitor child&apos;s progress and receive detailed reports
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How AI Teacher Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Simple steps to transform your learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold">Assessment</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Take a quick assessment to help our AI understand your current knowledge level and learning preferences.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="text-xl font-semibold">Personalized Path</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI creates a customized learning path tailored specifically to your goals, pace, and learning style.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-semibold">Master & Progress</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Learn with interactive lessons, get instant feedback, and unlock new topics as you master each concept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real stories from students, teachers, and parents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  &ldquo;AI Teacher helped me improve my math grades from C to A+ in just 3 months. 
                  The personalized lessons made all the difference!&rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Martinez</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">High School Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  &ldquo;As a teacher, AI Teacher gives me incredible insights into my students&apos; progress. 
                  It&apos;s like having an assistant that never sleeps.&rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">DJ</span>
                  </div>
                  <div>
                    <p className="font-semibold">David Johnson</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Middle School Teacher</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  &ldquo;Finally, a platform that keeps my daughter engaged in learning. 
                  The progress reports help me stay involved in her education.&rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">LC</span>
                  </div>
                  <div>
                    <p className="font-semibold">Lisa Chen</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Parent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transform Your Learning Journey
            </h2>
            <p className="text-xl text-indigo-100">
              Experience the benefits of AI-powered education
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">3x Faster Learning</h3>
              <p className="text-indigo-100 text-sm">
                Students learn concepts 3x faster with personalized AI tutoring
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">24/7 Availability</h3>
              <p className="text-indigo-100 text-sm">
                Learn anytime, anywhere with your personal AI teacher
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">Proven Results</h3>
              <p className="text-indigo-100 text-sm">
                98% of students show measurable improvement within 30 days
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">Engaging Experience</h3>
              <p className="text-indigo-100 text-sm">
                Interactive lessons that make learning fun and memorable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="space-y-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Lightbulb className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Your Learning?
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of students who are already experiencing the future of education. 
              Start your personalized learning journey today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 h-auto">
                <Link href="/login" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 h-auto">
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No setup fees
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}