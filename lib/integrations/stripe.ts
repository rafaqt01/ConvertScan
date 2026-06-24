// Conector: Stripe
import { createServiceSupabase } from '@/lib/supabase/server';

interface SyncContext {
  organizationId: string;
  integrationId: string;
  config: Record<string, unknown>;
  accessToken?: string | null;
}

export async function sync(ctx: SyncContext) {
  if (!ctx.accessToken) return { ok: false, error: 'missing access token' };

  const supabase = createServiceSupabase();
  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  const url = `https://api.stripe.com/v1/charges?created[gte]=${since}&limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ctx.accessToken}` } });
  if (!res.ok) return { ok: false, error: `Stripe ${res.status}` };

  const data = await res.json();
  let inserted = 0;
  let total = 0;

  for (const charge of data.data ?? []) {
    if (charge.status !== 'succeeded') continue;
    const amount = (charge.amount ?? 0) / 100;
    const date = new Date((charge.created ?? 0) * 1000).toISOString().slice(0, 10);
    const email = charge.billing_details?.email ?? charge.receipt_email;

    if (email) {
      await supabase.from('customers').upsert({
        organization_id: ctx.organizationId,
        external_id: charge.customer ?? email,
        email,
        name: charge.billing_details?.name,
        ltv: amount,
        total_orders: 1,
      }, { onConflict: 'organization_id,external_id' });
    }

    await supabase.from('revenue_entries').insert({
      organization_id: ctx.organizationId,
      amount,
      currency: (charge.currency ?? 'brl').toUpperCase(),
      description: charge.description ?? 'Stripe charge',
      occurred_at: new Date((charge.created ?? 0) * 1000).toISOString(),
    });

    await supabase.from('metrics_daily').upsert({
      organization_id: ctx.organizationId,
      date,
      revenue: amount,
      deals_won_count: 1,
    }, { onConflict: 'organization_id,source_id,campaign_id,date' });

    inserted++;
    total += amount;
  }

  return { ok: true, records: inserted, total };
}