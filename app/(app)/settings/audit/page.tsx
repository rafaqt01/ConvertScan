import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader title="Auditoria" description="Histórico de ações na sua organização." />
      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {(!logs || logs.length === 0) ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhum evento registrado ainda.</div>
          ) : (
            <div className="space-y-1">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2 text-xs">
                  <div>
                    <span className="font-mono font-medium">{l.action}</span>
                    <span className="text-muted-foreground"> · {l.resource_type}</span>
                  </div>
                  <span className="text-muted-foreground">{formatDateTime(l.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}