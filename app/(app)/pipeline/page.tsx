import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { PipelineClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  const supabase = createServerSupabase();
  const [stagesRes, dealsRes] = await Promise.all([
    supabase.from('pipeline_stages').select('*').eq('organization_id', org.id).order('position'),
    supabase
      .from('deals')
      .select('*, contact:contacts(first_name, last_name, email), company:companies(name), owner:profiles!deals_owner_id_fkey(full_name, avatar_url)')
      .eq('organization_id', org.id)
      .eq('status', 'open')
      .order('position', { ascending: true })
      .limit(500),
  ]);

  return (
    <Suspense fallback={<Skeleton className="h-96 m-6" />}>
      <PipelineClient
        stages={stagesRes.data ?? []}
        initialDeals={dealsRes.data ?? []}
      />
    </Suspense>
  );
}