import { Metadata } from 'next';
import { InclusivityAuditDashboard } from '@/components/inclusivity/InclusivityAuditDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Brain, Globe, Eye, FileText, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Inclusivity Audit Management',
  description: 'Manage inclusivity audits and accessibility accommodations',
};

export default function InclusivityPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inclusivity Audit Management</h1>
          <p className="text-gray-600">
            Ensure inclusive learning experiences for all students
          </p>
        </div>
      </div>

      <Tabs defaultValue="audits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audits" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audits
          </TabsTrigger>
          <TabsTrigger value="accommodations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Accommodations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audits">
          <InclusivityAuditDashboard />
        </TabsContent>

        <TabsContent value="accommodations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  ADHD Accommodations
                </CardTitle>
                <CardDescription>
                  Structured pacing and attention support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Flexible time limits</li>
                  <li>• Break reminders</li>
                  <li>• Reduced distractions</li>
                  <li>• Progress tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Learning Disabilities
                </CardTitle>
                <CardDescription>
                  Support for dyslexia and other challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Text-to-speech options</li>
                  <li>• Font customization</li>
                  <li>• Visual aids</li>
                  <li>• Simplified language</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Cultural Sensitivity
                </CardTitle>
                <CardDescription>
                  Inclusive content and representation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Diverse examples</li>
                  <li>• Cultural context</li>
                  <li>• Language support</li>
                  <li>• Religious considerations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-orange-600" />
                  Visual Accessibility
                </CardTitle>
                <CardDescription>
                  Support for visual impairments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• High contrast modes</li>
                  <li>• Screen reader support</li>
                  <li>• Large text options</li>
                  <li>• Colorblind-friendly palettes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-red-600" />
                  Cognitive Accessibility
                </CardTitle>
                <CardDescription>
                  Support for cognitive differences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Simplified navigation</li>
                  <li>• Clear instructions</li>
                  <li>• Progress indicators</li>
                  <li>• Error prevention</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Language Barriers
                </CardTitle>
                <CardDescription>
                  Support for ESL and multilingual users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Translation support</li>
                  <li>• Simplified vocabulary</li>
                  <li>• Visual explanations</li>
                  <li>• Cultural context</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
