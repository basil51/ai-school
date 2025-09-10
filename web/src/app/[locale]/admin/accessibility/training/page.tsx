import { Metadata } from 'next';
import AccessibilityTraining from '@/components/accessibility/AccessibilityTraining';

export const metadata: Metadata = {
  title: 'Accessibility Training | AI Teacher',
  description: 'Manage accessibility training programs and track completion',
};

export default function AccessibilityTrainingPage() {
  return (
    <div className="container mx-auto py-6">
      <AccessibilityTraining />
    </div>
  );
}
