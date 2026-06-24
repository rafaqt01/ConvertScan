import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { IntegrationsClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', org.id);

  return (
    <Suspense fallback={<Skeleton className="h-96 m-6" />}>
      <IntegrationsClient integrations={integrations ?? []} />
    </Suspense>
  );
}