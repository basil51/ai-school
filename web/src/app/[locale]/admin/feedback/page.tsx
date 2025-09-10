import { Metadata } from 'next';
import { FeedbackDashboard } from '@/components/feedback/FeedbackDashboard';
import { FeedbackAnalytics } from '@/components/feedback/FeedbackAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Feedback Management',
  description: 'Manage and analyze user feedback',
};

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <p className="text-gray-600">
            Manage user feedback and track improvement opportunities
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FeedbackDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <FeedbackAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
