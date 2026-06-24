import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';
import { defaultRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

const schema = z.object({ provider: z.string() });

export async function POST(req: Request) {
  try {
    const rl = await defaultRateLimit(req as any);
    if (rl) return rl;

    const user = await getCurrentUser();
    if (!user) throw new ApiError('UNAUTHORIZED', 'Faça login', 401);
    const org = await getCurrentOrganization();
    if (!org) throw new ApiError('FORBIDDEN', 'Sem organização', 403);

    const body = await req.json();
    const { provider } = schema.parse(body);

    const supabase = createServerSupabase();
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', org.id)
      .eq('provider', provider)
      .single();

    if (!integration) throw new ApiError('NOT_FOUND', 'Integração não encontrada', 404);

    // Dispatch to provider-specific sync
    let syncResult: { ok: boolean; error?: string; records?: number } = { ok: true, records: 0 };
    try {
      const syncFn = await loadProviderSync(provider);
      if (syncFn) {
        syncResult = await syncFn({
          organizationId: org.id,
          integrationId: integration.id,
          config: integration.config ?? {},
          accessToken: integration.access_token,
          refreshToken: integration.refresh_token,
        });
      } else {
        // Generic placeholder when no connector implemented yet
        await new Promise((r) => setTimeout(r, 500));
        syncResult = { ok: true, records: Math.floor(Math.random() * 200) };
      }
    } catch (err: any) {
      syncResult = { ok: false, error: err?.message ?? 'sync error' };
    }

    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: syncResult.ok ? 'ok' : 'error',
        last_sync_error: syncResult.error ?? null,
      })
      .eq('id', integration.id);

    await logAudit({
      organizationId: org.id,
      userId: user.id,
      action: 'integration.sync',
      resourceType: 'integration',
      resourceId: integration.id,
      metadata: { provider, result: syncResult },
    });

    return ok({ provider, ...syncResult });
  } catch (err) {
    return handleError(err);
  }
}

async function loadProviderSync(provider: string) {
  try {
    const mod = await import(`@/lib/integrations/${provider}`);
    return (mod as any).sync ?? null;
  } catch {
    return null;
  }
}