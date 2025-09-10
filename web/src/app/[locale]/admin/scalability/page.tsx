import { Metadata } from 'next';
import ScalabilityTestingDashboard from '@/components/scalability/ScalabilityTestingDashboard';

export const metadata: Metadata = {
  title: 'Scalability Testing | AI Teacher',
  description: 'Load testing for 1,000+ concurrent students and performance optimization',
};

export default function ScalabilityTestingPage() {
  return (
    <div className="container mx-auto py-6">
      <ScalabilityTestingDashboard />
    </div>
  );
}
