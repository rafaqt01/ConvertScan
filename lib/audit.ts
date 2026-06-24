import { createServiceSupabase } from './supabase/server';

export async function logAudit(params: {
  organizationId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const supabase = createServiceSupabase();
    await supabase.from('audit_logs').insert({
      organization_id: params.organizationId,
      user_id: params.userId ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? {},
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    });
  } catch (err) {
    console.error('[audit] failed to write log', err);
  }
}
