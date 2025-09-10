import { Metadata } from 'next';
import AccessibilityTesting from '@/components/accessibility/AccessibilityTesting';

export const metadata: Metadata = {
  title: 'Accessibility Testing | AI Teacher',
  description: 'Conduct and manage accessibility tests for WCAG compliance',
};

export default function AccessibilityTestingPage() {
  return (
    <div className="container mx-auto py-6">
      <AccessibilityTesting />
    </div>
  );
}
