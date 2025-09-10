import { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Lightbulb, Bug, Eye, Zap, Users, FileText, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Share Your Feedback',
  description: 'Help us improve the AI School platform by sharing your feedback',
};

const feedbackTypes = [
  {
    type: 'bug_report',
    title: 'Report a Bug',
    description: 'Found something that\'s not working? Let us know!',
    icon: Bug,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    type: 'feature_request',
    title: 'Request a Feature',
    description: 'Have an idea for a new feature? We\'d love to hear it!',
    icon: Lightbulb,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'improvement_suggestion',
    title: 'Suggest an Improvement',
    description: 'Think something could be better? Share your suggestions!',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: 'usability_issue',
    title: 'Usability Issue',
    description: 'Something confusing or hard to use? Tell us about it!',
    icon: Users,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    type: 'accessibility_concern',
    title: 'Accessibility Concern',
    description: 'Help us make the platform more accessible for everyone!',
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    type: 'performance_issue',
    title: 'Performance Issue',
    description: 'Experiencing slow loading or other performance problems?',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: 'content_feedback',
    title: 'Content Feedback',
    description: 'Feedback about lessons, assessments, or educational content!',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    type: 'general_feedback',
    title: 'General Feedback',
    description: 'Any other thoughts or comments about your experience!',
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Share Your Feedback</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your feedback helps us make AI School better for everyone. Whether you found a bug, 
          have a feature request, or just want to share your experience, we want to hear from you!
        </p>
      </div>

      {/* Feedback Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {feedbackTypes.map((feedbackType) => {
          const IconComponent = feedbackType.icon;
          return (
            <Card key={feedbackType.type} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full ${feedbackType.bgColor} flex items-center justify-center mb-4`}>
                  <IconComponent className={`h-8 w-8 ${feedbackType.color}`} />
                </div>
                <CardTitle className="text-lg">{feedbackType.title}</CardTitle>
                <CardDescription className="text-sm">
                  {feedbackType.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Main Feedback Form */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit Your Feedback
            </CardTitle>
            <CardDescription>
              Fill out the form below to share your feedback with us. All feedback is valuable 
              and helps us improve the platform for everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>
      </div>

      {/* Why Feedback Matters */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Why Your Feedback Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  Drive Innovation
                </h3>
                <p className="text-sm text-gray-600">
                  Your ideas and suggestions help us develop new features and improvements 
                  that make learning more effective and enjoyable.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bug className="h-5 w-5 text-red-600" />
                  Fix Issues Quickly
                </h3>
                <p className="text-sm text-gray-600">
                  When you report bugs or issues, we can fix them faster and prevent 
                  other users from experiencing the same problems.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Improve User Experience
                </h3>
                <p className="text-sm text-gray-600">
                  Your feedback about usability and user experience helps us make 
                  the platform more intuitive and user-friendly.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Ensure Accessibility
                </h3>
                <p className="text-sm text-gray-600">
                  Accessibility feedback helps us make the platform usable for 
                  everyone, regardless of their abilities or circumstances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">We Review Your Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Our team carefully reviews all feedback and categorizes it for appropriate action.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">We Take Action</h3>
                  <p className="text-sm text-gray-600">
                    Depending on the feedback type, we may fix bugs, implement features, 
                    or make improvements to the platform.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">We Follow Up</h3>
                  <p className="text-sm text-gray-600">
                    For significant feedback, we may follow up with you to provide updates 
                    or ask for additional information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
