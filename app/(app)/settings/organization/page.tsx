import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrganizationSettingsPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { data: members } = await supabase
    .from('memberships')
    .select('*, user:profiles(id, email, full_name, avatar_url)')
    .eq('organization_id', org.id)
    .order('joined_at');

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <PageHeader title="Organização" description="Gerencie sua empresa, equipe e permissões." />

      <Card>
        <CardHeader>
          <CardTitle>Informações da empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="Nome" value={org.name} />
          <Row label="Slug" value={org.slug} />
          <Row label="Site" value={org.website ?? '—'} />
          <Row label="Setor" value={org.industry ?? '—'} />
          <Row label="Tamanho" value={org.size ?? '—'} />
          <Row label="Plano" value={<Badge variant="default">{org.plan}</Badge>} />
          <Row label="Status" value={<Badge variant={org.subscription_status === 'active' ? 'success' : 'muted'}>{org.subscription_status}</Badge>} />
          <Row label="Trial expira" value={org.trial_ends_at ? formatDate(org.trial_ends_at) : '—'} />
          <Row label="Criada em" value={formatDate(org.created_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>{members?.length ?? 0} membros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(members ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3">
                <div>
                  <p className="text-sm font-medium">{m.user?.full_name ?? m.user?.email}</p>
                  <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{m.role}</Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(m.joined_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}