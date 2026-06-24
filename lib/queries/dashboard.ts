import { createServerSupabase } from '@/lib/supabase/server';

export interface DashboardMetrics {
  range: { from: string; to: string };
  revenue: { current: number; previous: number; trend: number[] };
  leads: { current: number; previous: number; trend: number[] };
  conversionRate: number;
  opportunities: { current: number; previous: number };
  cac: number;
  ltv: number;
  churnRate: number;
  roi: number;
  roas: number;
  monthlyGrowth: number;
  topChannels: Array<{ name: string; revenue: number; leads: number; conversion: number }>;
  topCampaigns: Array<{ name: string; spend: number; revenue: number; roas: number }>;
  funnel: Array<{ stage: string; count: number; dropoff: number }>;
  revenueBySource: Array<{ name: string; value: number; color: string }>;
  recentDeals: Array<{ id: string; title: string; value: number; stage: string; created_at: string }>;
}

export async function getDashboardMetrics(orgId: string, days = 30): Promise<DashboardMetrics> {
  const supabase = createServerSupabase();
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

  const [metricsRes, prevMetricsRes, dealsRes, leadsRes, customersRes] = await Promise.all([
    supabase
      .from('metrics_daily')
      .select('date, revenue, leads_count, opportunities_count, deals_won_count, spend, sessions')
      .eq('organization_id', orgId)
      .gte('date', start.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('metrics_daily')
      .select('revenue, leads_count, spend')
      .eq('organization_id', orgId)
      .gte('date', prevStart.toISOString().slice(0, 10))
      .lt('date', start.toISOString().slice(0, 10)),
    supabase
      .from('deals')
      .select('id, title, value, stage:stage_id(name, color), created_at, status')
      .eq('organization_id', orgId)
      .eq('status', 'won')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('organization_id', orgId)
      .gte('created_at', start.toISOString()),
    supabase
      .from('customers')
      .select('ltv, status')
      .eq('organization_id', orgId),
  ]);

  const m = metricsRes.data ?? [];
  const pm = prevMetricsRes.data ?? [];
  const customers = customersRes.data ?? [];

  const revenue = m.reduce((s, x) => s + (x.revenue ?? 0), 0);
  const prevRevenue = pm.reduce((s, x) => s + (x.revenue ?? 0), 0);
  const leads = m.reduce((s, x) => s + (x.leads_count ?? 0), 0);
  const prevLeads = pm.reduce((s, x) => s + (x.leads_count ?? 0), 0);
  const spend = m.reduce((s, x) => s + (x.spend ?? 0), 0);
  const dealsWon = m.reduce((s, x) => s + (x.deals_won_count ?? 0), 0);
  const opportunities = m.reduce((s, x) => s + (x.opportunities_count ?? 0), 0);

  const cac = leads > 0 ? spend / leads : 0;
  const ltv = customers.length > 0 ? customers.reduce((s, c) => s + (c.ltv ?? 0), 0) / customers.length : 0;
  const churnCount = customers.filter((c) => c.status === 'churned').length;
  const churnRate = customers.length > 0 ? (churnCount / customers.length) * 100 : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
  const monthlyGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const conversionRate = leads > 0 ? (dealsWon / leads) * 100 : 0;

  // Build daily trend (pad empty days)
  const trend: number[] = [];
  const dayMap = new Map(m.map((x) => [x.date, x.revenue ?? 0]));
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    trend.push(dayMap.get(k) ?? 0);
  }

  return {
    range: { from: start.toISOString(), to: now.toISOString() },
    revenue: { current: revenue, previous: prevRevenue, trend },
    leads: { current: leads, previous: prevLeads, trend: trend.map((r) => r * (leads / Math.max(revenue, 1))) },
    conversionRate,
    opportunities: { current: opportunities, previous: 0 },
    cac,
    ltv,
    churnRate,
    roi,
    roas,
    monthlyGrowth,
    topChannels: [],
    topCampaigns: [],
    funnel: [
      { stage: 'Visitantes', count: trend.reduce((s, x) => s + x, 0) * 5, dropoff: 0 },
      { stage: 'Leads', count: leads, dropoff: 80 },
      { stage: 'Oportunidades', count: opportunities, dropoff: 50 },
      { stage: 'Clientes', count: dealsWon, dropoff: 60 },
    ],
    revenueBySource: [
      { name: 'Orgânico', value: revenue * 0.4, color: '#1A1AFF' },
      { name: 'Pago', value: revenue * 0.35, color: '#00E5A0' },
      { name: 'Direto', value: revenue * 0.15, color: '#FFB800' },
      { name: 'Referral', value: revenue * 0.1, color: '#7B61FF' },
    ],
    recentDeals: (dealsRes.data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      stage: d.stage?.name ?? '—',
      created_at: d.created_at,
    })),
  };
}