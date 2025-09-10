import { Metadata } from 'next';
import AccessibilityComplianceDashboard from '@/components/accessibility/AccessibilityComplianceDashboard';

export const metadata: Metadata = {
  title: 'Accessibility Compliance | AI Teacher',
  description: 'Manage WCAG 2.1 AA compliance, findings, and recommendations',
};

export default function AccessibilityCompliancePage() {
  return (
    <div className="container mx-auto py-6">
      <AccessibilityComplianceDashboard />
    </div>
  );
}
