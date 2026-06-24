import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { FunnelClient } from './client';

export const dynamic = 'force-dynamic';

export default async function FunnelPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const start = new Date(); start.setDate(start.getDate() - 30);

  const [{ data: metrics }, { data: deals }] = await Promise.all([
    supabase
      .from('metrics_daily')
      .select('sessions, leads_count, opportunities_count, deals_won_count')
      .eq('organization_id', org.id)
      .gte('date', start.toISOString().slice(0, 10)),
    supabase
      .from('deals')
      .select('stage:stage_id(name, position)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const totals = (metrics ?? []).reduce(
    (acc, m) => ({
      sessions: acc.sessions + (m.sessions ?? 0),
      leads: acc.leads + (m.leads_count ?? 0),
      opportunities: acc.opportunities + (m.opportunities_count ?? 0),
      customers: acc.customers + (m.deals_won_count ?? 0),
    }),
    { sessions: 0, leads: 0, opportunities: 0, customers: 0 }
  );

  // Stage breakdown
  const stageMap = new Map<string, number>();
  (deals ?? []).forEach((d: any) => {
    const name = d.stage?.name ?? 'Sem etapa';
    stageMap.set(name, (stageMap.get(name) ?? 0) + 1);
  });

  return (
    <Suspense fallback={null}>
      <FunnelClient
        visitors={totals.sessions}
        leads={totals.leads}
        opportunities={totals.opportunities}
        customers={totals.customers}
        stageBreakdown={Array.from(stageMap.entries()).map(([name, count]) => ({ name, count }))}
      />
    </Suspense>
  );
}