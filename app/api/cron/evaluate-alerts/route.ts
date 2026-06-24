import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isAuthorized(req: Request) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) throw new ApiError('UNAUTHORIZED', 'Invalid token', 401);

    const supabase = createServiceSupabase();

    // Detect anomalies and create alerts
    const today = new Date();
    const start30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start60 = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await supabase.from('organizations').select('id');

    let alertsCreated = 0;
    for (const org of orgs ?? []) {
      const [last30, prev30] = await Promise.all([
        supabase
          .from('metrics_daily')
          .select('revenue, leads_count, spend, deals_won_count')
          .eq('organization_id', org.id)
          .gte('date', start30.toISOString().slice(0, 10)),
        supabase
          .from('metrics_daily')
          .select('revenue, leads_count, spend, deals_won_count')
          .eq('organization_id', org.id)
          .gte('date', start60.toISOString().slice(0, 10))
          .lt('date', start30.toISOString().slice(0, 10)),
      ]);

      const sumLast = (rows: any[] | null, key: string) => (rows ?? []).reduce((s, r) => s + (r[key] ?? 0), 0);
      const l = last30.data ?? [];
      const p = prev30.data ?? [];

      const checks = [
        { metric: 'revenue', label: 'Receita', current: sumLast(l, 'revenue'), previous: sumLast(p, 'revenue') },
        { metric: 'leads_count', label: 'Leads', current: sumLast(l, 'leads_count'), previous: sumLast(p, 'leads_count') },
        { metric: 'spend', label: 'Investimento', current: sumLast(l, 'spend'), previous: sumLast(p, 'spend') },
        { metric: 'deals_won_count', label: 'Vendas', current: sumLast(l, 'deals_won_count'), previous: sumLast(p, 'deals_won_count') },
      ];

      for (const c of checks) {
        if (c.previous > 0 && c.current > 0) {
          const change = ((c.current - c.previous) / c.previous) * 100;
          if (Math.abs(change) >= 15) {
            const severity = Math.abs(change) >= 30 ? 'critical' : 'warning';
            const desc = change > 0 ? `subiu ${change.toFixed(1)}%` : `caiu ${Math.abs(change).toFixed(1)}%`;
            await supabase.from('alerts').insert({
              organization_id: org.id,
              severity,
              status: 'active',
              title: `${c.label} ${desc} vs. período anterior`,
              description: `Variação significativa detectada. Valor atual: ${c.current.toFixed(0)}, anterior: ${c.previous.toFixed(0)}.`,
              metric: c.metric,
              current_value: c.current,
              previous_value: c.previous,
              change_percent: change,
            });
            alertsCreated++;
          }
        }
      }
    }

    return ok({ alertsCreated, timestamp: new Date().toISOString() });
  } catch (err) {
    return handleError(err);
  }
}