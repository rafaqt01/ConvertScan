// Placeholder connector pattern — copy and implement for new providers.
interface SyncContext {
  organizationId: string;
  integrationId: string;
  config: Record<string, unknown>;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export async function sync(_ctx: SyncContext) {
  // TODO: implement provider-specific logic.
  // Always return ok unless the provider is unavailable; the hub will still update last_sync_at.
  return { ok: true, records: 0 };
}