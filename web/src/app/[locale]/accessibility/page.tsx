import { Metadata } from 'next';
import { AccessibilityPreferences } from '@/components/inclusivity/AccessibilityPreferences';
import { ADHDFriendlyPacing } from '@/components/inclusivity/ADHDFriendlyPacing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Settings, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accessibility & Inclusivity',
  description: 'Customize your learning experience for optimal accessibility and inclusivity',
};

export default function AccessibilityPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="pacing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            ADHD Pacing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <AccessibilityPreferences />
        </TabsContent>

        <TabsContent value="pacing">
          <ADHDFriendlyPacing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
