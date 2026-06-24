import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { OnboardingForm } from './form';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = createServerSupabase();
  const { data: existing } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .limit(1)
    .single();

  return <OnboardingForm defaultName={existing?.name ?? (user.user_metadata?.org_name as string | undefined) ?? ''} defaultFullName={user.user_metadata?.full_name as string | undefined ?? ''} email={user.email!} />;
}

export const dynamic = 'force-dynamic';