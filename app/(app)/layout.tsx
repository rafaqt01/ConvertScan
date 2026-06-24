import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentProfile, getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AppShell } from '@/components/shell/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, profile, organization] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCurrentOrganization(),
  ]);

  if (!user) redirect('/login');
  if (!organization) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { count: alertCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organization.id)
    .eq('status', 'active');

  return (
    <AppShell
      organization={organization}
      user={{
        email: user.email!,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
      alertCount={alertCount ?? 0}
    >
      {children}
    </AppShell>
  );
}