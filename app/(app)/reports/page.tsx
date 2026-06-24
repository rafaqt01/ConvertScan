import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { ReportsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <Suspense fallback={null}>
      <ReportsClient reports={reports ?? []} />
    </Suspense>
  );
}