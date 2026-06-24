// Live status endpoint for integrations
import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceSupabase();
    const { count: orgsCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: integrationsCount } = await supabase.from('integrations').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'operational',
      metrics: {
        organizations: orgsCount ?? 0,
        events: eventsCount ?? 0,
        integrations: integrationsCount ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: 'degraded', error: String(err) }, { status: 503 });
  }
}