import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const org = await getCurrentOrganization();
  if (!org) redirect('/onboarding');

  redirect('/dashboard');
}

export const dynamic = 'force-dynamic';