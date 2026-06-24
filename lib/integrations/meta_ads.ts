// Conector: Meta Ads (Facebook Marketing API)
import { createServiceSupabase } from '@/lib/supabase/server';

interface SyncContext {
  organizationId: string;
  integrationId: string;
  config: Record<string, unknown>;
  accessToken?: string | null;
}

export async function sync(ctx: SyncContext) {
  const accountId = ctx.config.accountId as string;
  if (!accountId || !ctx.accessToken) {
    return { ok: false, error: 'missing accountId or access token' };
  }

  const supabase = createServiceSupabase();
  const today = new Date();
  const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since = Math.floor(start.getTime() / 1000);
  const until = Math.floor(today.getTime() / 1000);

  const url = `https://graph.facebook.com/v20.0/act_${accountId}/insights?level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,actions&time_range={'since':'${start.toISOString().slice(0, 10)}','until':'${today.toISOString().slice(0, 10)}'}&access_token=${ctx.accessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false, error: `Meta ${res.status}` };
  }

  const data = await res.json();
  let inserted = 0;

  for (const c of data.data ?? []) {
    const spend = Number(c.spend ?? 0);
    const leads = (c.actions ?? []).filter((a: any) => a.action_type === 'lead').reduce((s: number, a: any) => s + Number(a.value), 0);
    const date = today.toISOString().slice(0, 10);

    const { data: src } = await supabase
      .from('sources')
      .upsert({ organization_id: ctx.organizationId, name: 'Meta Ads', type: 'ads' }, { onConflict: 'organization_id,name,type' })
      .select()
      .single();

    const { data: campaign } = await supabase
      .from('campaigns')
      .upsert({
        organization_id: ctx.organizationId,
        source_id: src?.id,
        integration_id: ctx.integrationId,
        external_id: c.campaign_id,
        name: c.campaign_name,
        spend,
        status: 'active',
      }, { onConflict: 'organization_id,integration_id,external_id' })
      .select()
      .single();

    await supabase.from('metrics_daily').upsert({
      organization_id: ctx.organizationId,
      source_id: src?.id,
      campaign_id: campaign?.id,
      date,
      spend,
      leads_count: leads,
    }, { onConflict: 'organization_id,source_id,campaign_id,date' });
    inserted++;
  }

  return { ok: true, records: inserted };
}