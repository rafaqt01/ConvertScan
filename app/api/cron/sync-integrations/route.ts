import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return false;
  return true;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) throw new ApiError('UNAUTHORIZED', 'Invalid token', 401);

    const supabase = createServiceSupabase();
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('status', 'connected');

    const results: any[] = [];
    for (const integration of integrations ?? []) {
      try {
        const mod = await import(`@/lib/integrations/${integration.provider}`);
        const result = await (mod as any).sync?.({
          organizationId: integration.organization_id,
          integrationId: integration.id,
          config: integration.config ?? {},
          accessToken: integration.access_token,
          refreshToken: integration.refresh_token,
        });

        await supabase
          .from('integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: result?.ok ? 'ok' : 'error',
            last_sync_error: result?.error ?? null,
          })
          .eq('id', integration.id);

        results.push({ provider: integration.provider, ...(result ?? { ok: true }) });
      } catch (err: any) {
        await supabase
          .from('integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error',
            last_sync_error: err?.message ?? String(err),
          })
          .eq('id', integration.id);
        results.push({ provider: integration.provider, ok: false, error: err?.message });
      }
    }

    return ok({ synced: results.length, results });
  } catch (err) {
    return handleError(err);
  }
}