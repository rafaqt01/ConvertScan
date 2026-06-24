import { NextResponse } from 'next/server';
import { complete } from '@/lib/openai';
import { createServiceSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isAuthorized(req: Request) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) throw new ApiError('UNAUTHORIZED', 'Invalid token', 401);

    const supabase = createServiceSupabase();
    const { data: orgs } = await supabase.from('organizations').select('id');

    let insights = 0;
    for (const org of orgs ?? []) {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const { data: metrics } = await supabase
        .from('metrics_daily')
        .select('revenue, leads_count, deals_won_count, spend, sessions')
        .eq('organization_id', org.id)
        .gte('date', start.toISOString().slice(0, 10));

      const m = metrics ?? [];
      const revenue = m.reduce((s, x) => s + (x.revenue ?? 0), 0);
      const leads = m.reduce((s, x) => s + (x.leads_count ?? 0), 0);
      const deals = m.reduce((s, x) => s + (x.deals_won_count ?? 0), 0);
      const spend = m.reduce((s, x) => s + (x.spend ?? 0), 0);
      const sessions = m.reduce((s, x) => s + (x.sessions ?? 0), 0);

      const context = `Receita: R$ ${revenue.toFixed(0)}, Leads: ${leads}, Vendas: ${deals}, Investimento: R$ ${spend.toFixed(0)}, Sessões: ${sessions}, Conversão: ${leads ? (deals / leads * 100).toFixed(2) : 0}%`;

      const result = await complete<any>(
        `Com base nos dados: ${context}. Gere 1 insight estratégico curto. JSON: {"title": string, "body": string, "recommendations": [{"title": string, "action": string, "impact": string}]}`,
        { jsonMode: true, maxTokens: 500, temperature: 0.6 }
      );

      if (result?.title) {
        await supabase.from('ai_insights').insert({
          organization_id: org.id,
          type: 'daily_digest',
          title: result.title,
          body: result.body ?? '',
          recommendations: result.recommendations ?? [],
        });
        insights++;
      }
    }

    return ok({ insights });
  } catch (err) {
    return handleError(err);
  }
}