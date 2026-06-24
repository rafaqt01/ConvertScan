import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AlertsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const org = await getCurrentOrganization();

  if (!org) {
    redirect('/onboarding');
  }

  const organizationId = Array.isArray(org) ? org[0]?.id : org.id;

  if (!organizationId) {
    redirect('/onboarding');
  }

  const supabase = createServerSupabase();

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <Suspense fallback={null}>
      <AlertsClient alerts={alerts ?? []} />
    </Suspense>
  );
}
