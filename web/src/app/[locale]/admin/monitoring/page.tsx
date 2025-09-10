import { Metadata } from 'next';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';

export const metadata: Metadata = {
  title: 'Continuous Monitoring | AI Teacher',
  description: 'Real-time system monitoring, performance metrics, and automated health checks',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <MonitoringDashboard />
    </div>
  );
}
