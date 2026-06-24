import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AnalyticsClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const start = new Date(); start.setDate(start.getDate() - 30);

  const [{ data: metrics }, { data: sources }] = await Promise.all([
    supabase
      .from('metrics_daily')
      .select('date, sessions, leads_count, revenue, spend, deals_won_count')
      .eq('organization_id', org.id)
      .gte('date', start.toISOString().slice(0, 10))
      .order('date'),
    supabase
      .from('sources')
      .select('*, campaigns(*)')
      .eq('organization_id', org.id)
      .limit(20),
  ]);

  return (
    <Suspense fallback={<Skeleton className="h-96 m-6" />}>
      <AnalyticsClient metrics={metrics ?? []} sources={sources ?? []} />
    </Suspense>
  );
}