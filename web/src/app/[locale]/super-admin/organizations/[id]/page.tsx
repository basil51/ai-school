'use client';

import { useParams } from 'next/navigation';
import OrganizationDetails from '@/components/OrganizationDetails';

export default function OrganizationDetailPage() {
  const params = useParams();
  const organizationId = params.id as string;

  return (
    <div className="container mx-auto py-8">
      <OrganizationDetails organizationId={organizationId} />
    </div>
  );
}
