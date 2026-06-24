// Conector: Google Analytics 4 (Data API)
import { createServiceSupabase } from '@/lib/supabase/server';

interface SyncContext {
  organizationId: string;
  integrationId: string;
  config: Record<string, unknown>;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export async function sync(ctx: SyncContext) {
  const propertyId = (ctx.config.propertyId as string) ?? process.env.GA4_DEFAULT_PROPERTY;
  if (!propertyId || !ctx.accessToken) {
    return { ok: false, error: 'missing propertyId or access token' };
  }

  const supabase = createServiceSupabase();
  const today = new Date();
  const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: start.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) }],
      dimensions: [{ name: 'date' }, { name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `GA4 ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = await res.json();
  const rows = data.rows ?? [];
  let inserted = 0;

  for (const row of rows) {
    const date = row.dimensionValues[0]?.value;
    const source = row.dimensionValues[1]?.value ?? 'direct';
    const sessions = Number(row.metricValues[0]?.value ?? 0);
    const users = Number(row.metricValues[1]?.value ?? 0);
    const conversions = Number(row.metricValues[2]?.value ?? 0);

    if (!date) continue;

    // Find or create source
    const { data: src } = await supabase
      .from('sources')
      .upsert({ organization_id: ctx.organizationId, name: source, type: 'analytics' }, { onConflict: 'organization_id,name,type' })
      .select()
      .single();

    await supabase.from('metrics_daily').upsert({
      organization_id: ctx.organizationId,
      source_id: src?.id ?? null,
      date,
      sessions,
      visitors: users,
      leads_count: conversions,
    }, { onConflict: 'organization_id,source_id,campaign_id,date' });
    inserted++;
  }

  return { ok: true, records: inserted };
}