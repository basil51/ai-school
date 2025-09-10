import { Metadata } from 'next';
import IntegrationsDashboard from '@/components/integrations/IntegrationsDashboard';

export const metadata: Metadata = {
  title: 'System Integrations | AI Teacher',
  description: 'Connect with LMS, SSO, and SIS systems for seamless data synchronization',
};

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-6">
      <IntegrationsDashboard />
    </div>
  );
}
