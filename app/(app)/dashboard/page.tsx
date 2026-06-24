import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/queries/dashboard';
import { DashboardClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const metrics = await getDashboardMetrics(org.id, 30);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient metrics={metrics} organizationName={org.name} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}