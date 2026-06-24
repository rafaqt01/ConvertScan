import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { CRMClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  return (
    <Suspense fallback={<Skeleton className="h-96 m-6" />}>
      <CRMClient />
    </Suspense>
  );
}