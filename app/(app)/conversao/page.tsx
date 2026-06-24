import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { ConversaoClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ConversaoPage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const { data: diagnostics } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <Suspense fallback={null}>
      <ConversaoClient diagnostics={diagnostics ?? []} organizationName={org.name} />
    </Suspense>
  );
}