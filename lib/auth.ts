import { createServerSupabase } from './supabase/server';

export async function getCurrentUser() {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function getCurrentOrganization() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from('memberships')
    .select('organization:organizations(*)')
    .eq('user_id', user.id)
    .limit(1);

  const membership = memberships?.[0];
  return membership?.organization ?? null;
}

export async function getCurrentMembership() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('memberships')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  return data;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
