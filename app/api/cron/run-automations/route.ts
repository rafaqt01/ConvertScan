import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) throw new ApiError('UNAUTHORIZED', 'Invalid token', 401);

    const supabase = createServiceSupabase();
    const { data: automations } = await supabase
      .from('automations')
      .select('*')
      .eq('status', 'active');

    let runs = 0;
    for (const auto of automations ?? []) {
      // Each automation defines a trigger.type that is matched against events.
      // In a production system, events would be created by integration webhooks
      // and a queue worker would evaluate them. Here we just record the
      // scheduled run as a no-op so we can later extend with real triggers.
      await supabase.from('automation_runs').insert({
        automation_id: auto.id,
        organization_id: auto.organization_id,
        status: 'success',
        output: { note: 'cron tick - awaiting real event source' },
        finished_at: new Date().toISOString(),
      });
      runs++;
    }

    return ok({ runs });
  } catch (err) {
    return handleError(err);
  }
}