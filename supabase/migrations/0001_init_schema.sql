-- =====================================================
-- CONVERSÃO 360° — Database Schema
-- Multi-tenant SaaS with strict RLS isolation
-- =====================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================
create type user_role as enum ('owner', 'admin', 'manager', 'sales', 'analyst');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type subscription_plan as enum ('starter', 'pro', 'enterprise');
create type deal_status as enum ('open', 'won', 'lost');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type alert_severity as enum ('info', 'warning', 'critical');
create type alert_status as enum ('active', 'acknowledged', 'resolved');
create type integration_provider as enum (
  'google_analytics', 'search_console', 'google_ads', 'meta_ads', 'linkedin_ads', 'tiktok_ads',
  'stripe', 'mercadopago', 'hotmart', 'kiwify', 'shopify',
  'hubspot', 'rd_station', 'pipedrive', 'whatsapp', 'google_sheets'
);
create type event_type as enum ('pageview', 'lead', 'opportunity', 'deal_won', 'deal_lost', 'revenue', 'churn', 'custom');
create type automation_status as enum ('draft', 'active', 'paused');

-- =====================================================
-- TABLES
-- =====================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  website text,
  industry text,
  size text,
  plan subscription_plan default 'starter',
  subscription_status subscription_status default 'trialing',
  trial_ends_at timestamptz,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  unique(organization_id, slug)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  phone text,
  locale text default 'pt-BR',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role user_role not null default 'sales',
  invited_by uuid references profiles(id),
  joined_at timestamptz default now(),
  unique(user_id, organization_id)
);

create table pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  color text default '#1A1AFF',
  probability integer default 10 check (probability between 0 and 100),
  is_won boolean default false,
  is_lost boolean default false,
  created_at timestamptz default now()
);

create table companies (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  size text,
  revenue numeric(15,2),
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_companies_org on companies(organization_id);
create index idx_companies_name_trgm on companies using gin (name gin_trgm_ops);

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  position text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_contacts_org on contacts(organization_id);
create index idx_contacts_email on contacts(email);
create index idx_contacts_name_trgm on contacts using gin ((first_name || ' ' || coalesce(last_name, '')) gin_trgm_ops);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  source text,
  medium text,
  campaign text,
  score integer default 0 check (score between 0 and 100),
  status text default 'new',
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_leads_org on leads(organization_id);
create index idx_leads_status on leads(organization_id, status);
create index idx_leads_created on leads(organization_id, created_at desc);

create table deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  stage_id uuid not null references pipeline_stages(id) on delete restrict,
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  title text not null,
  value numeric(15,2) default 0,
  currency text default 'BRL',
  status deal_status default 'open',
  expected_close_date date,
  closed_at timestamptz,
  position integer default 0,
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_deals_org on deals(organization_id);
create index idx_deals_stage on deals(stage_id, position);
create index idx_deals_status on deals(organization_id, status);

create table activities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null,
  subject text,
  body text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_activities_org on activities(organization_id, created_at desc);

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references profiles(id) on delete set null,
  creator_id uuid references profiles(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  priority task_priority default 'medium',
  status task_status default 'todo',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_tasks_org on tasks(organization_id, status);
create index idx_tasks_assignee on tasks(assignee_id, status);

create table notes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  deal_id uuid references deals(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table integrations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider integration_provider not null,
  status text default 'disconnected',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  config jsonb default '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, provider)
);

create table sources (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null,
  medium text,
  created_at timestamptz default now(),
  unique(organization_id, name, type)
);

create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  integration_id uuid references integrations(id) on delete set null,
  external_id text,
  name text not null,
  status text,
  spend numeric(15,2) default 0,
  currency text default 'BRL',
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_campaigns_org on campaigns(organization_id);

create table events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type event_type not null,
  session_id text,
  user_id text,
  source_id uuid references sources(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  page_path text,
  page_title text,
  referrer text,
  country text,
  device text,
  value numeric(15,2) default 0,
  currency text default 'BRL',
  properties jsonb default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  ingested_at timestamptz default now()
);
create index idx_events_org_time on events(organization_id, occurred_at desc);
create index idx_events_type on events(organization_id, event_type, occurred_at desc);
create index idx_events_session on events(session_id);
create index idx_events_source on events(organization_id, source_id, occurred_at desc);

create table metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  date date not null,
  sessions integer default 0,
  visitors integer default 0,
  pageviews integer default 0,
  leads_count integer default 0,
  opportunities_count integer default 0,
  deals_won_count integer default 0,
  revenue numeric(15,2) default 0,
  spend numeric(15,2) default 0,
  refunds numeric(15,2) default 0,
  churn_count integer default 0,
  metadata jsonb default '{}'::jsonb,
  unique(organization_id, source_id, campaign_id, date)
);
create index idx_metrics_org_date on metrics_daily(organization_id, date desc);

create table customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  external_id text,
  email text,
  name text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  ltv numeric(15,2) default 0,
  total_orders integer default 0,
  status text default 'active',
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, external_id)
);
create index idx_customers_org on customers(organization_id);

create table revenue_entries (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  source_id uuid references sources(id) on delete set null,
  amount numeric(15,2) not null,
  currency text default 'BRL',
  description text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz default now()
);
create index idx_revenue_org_time on revenue_entries(organization_id, occurred_at desc);

create table automations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  status automation_status default 'draft',
  trigger jsonb not null,
  steps jsonb not null default '[]'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table automation_runs (
  id uuid primary key default uuid_generate_v4(),
  automation_id uuid not null references automations(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  status text default 'running',
  input jsonb,
  output jsonb,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);
create index idx_automation_runs_auto on automation_runs(automation_id);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  severity alert_severity default 'info',
  status alert_status default 'active',
  title text not null,
  description text,
  metric text,
  previous_value numeric,
  current_value numeric,
  change_percent numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
create index idx_alerts_org_status on alerts(organization_id, status, created_at desc);

create table ai_insights (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  recommendations jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  acknowledged boolean default false,
  created_at timestamptz default now()
);
create index idx_insights_org_time on ai_insights(organization_id, created_at desc);

create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_ai_messages_conv on ai_messages(conversation_id, created_at);

create table diagnostics (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  website text,
  instagram text,
  niche text,
  objective text,
  overall_score integer,
  acquisition_score integer,
  conversion_score integer,
  retention_score integer,
  revenue_score integer,
  automation_score integer,
  bottlenecks jsonb default '[]'::jsonb,
  opportunities jsonb default '[]'::jsonb,
  priorities jsonb default '[]'::jsonb,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  name text not null,
  type text not null,
  format text not null,
  config jsonb default '{}'::jsonb,
  file_path text,
  file_size bigint,
  shared_token text unique,
  shared_expires_at timestamptz,
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);
create index idx_audit_org_time on audit_logs(organization_id, created_at desc);

-- =====================================================
-- TRIGGERS — updated_at maintenance
-- =====================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at before update on organizations for each row execute function set_updated_at();
create trigger companies_updated_at before update on companies for each row execute function set_updated_at();
create trigger contacts_updated_at before update on contacts for each row execute function set_updated_at();
create trigger leads_updated_at before update on leads for each row execute function set_updated_at();
create trigger deals_updated_at before update on deals for each row execute function set_updated_at();
create trigger tasks_updated_at before update on tasks for each row execute function set_updated_at();
create trigger automations_updated_at before update on automations for each row execute function set_updated_at();
create trigger integrations_updated_at before update on integrations for each row execute function set_updated_at();
create trigger campaigns_updated_at before update on campaigns for each row execute function set_updated_at();
create trigger customers_updated_at before update on customers for each row execute function set_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger ai_conversations_updated_at before update on ai_conversations for each row execute function set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table organizations enable row level security;
alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table pipeline_stages enable row level security;
alter table companies enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table integrations enable row level security;
alter table sources enable row level security;
alter table campaigns enable row level security;
alter table events enable row level security;
alter table metrics_daily enable row level security;
alter table customers enable row level security;
alter table revenue_entries enable row level security;
alter table automations enable row level security;
alter table automation_runs enable row level security;
alter table alerts enable row level security;
alter table ai_insights enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table diagnostics enable row level security;
alter table reports enable row level security;
alter table audit_logs enable row level security;

-- Helper: get current user's org IDs (used by RLS)
create or replace function auth_org_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select organization_id from memberships where user_id = auth.uid();
$$;

create or replace function has_org_role(roles user_role[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
      and organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
)
      and role = any(roles)
  );
$$;

-- ===== Profiles (own row only) =====
create policy "profiles self read" on profiles for select using (id = auth.uid());
create policy "profiles self update" on profiles for update using (id = auth.uid());
create policy "profiles self insert" on profiles for insert with check (id = auth.uid());

-- ===== Memberships =====
create policy "members read own orgs" on memberships for select using (user_id = auth.uid() or organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));
create policy "admins manage memberships" on memberships for all using (has_org_role(array['owner','admin']::user_role[]));

-- ===== Organizations =====
create policy "members read org" on organizations for select using (id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));
create policy "admins update org" on organizations for update using (has_org_role(array['owner','admin']::user_role[]));

-- ===== Workspaces =====
create policy "members read workspace" on workspaces for select using (organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));
create policy "admins manage workspace" on workspaces for all using (has_org_role(array['owner','admin']::user_role[]));

-- ===== Tenant-scoped tables =====
-- For each: read for any member, write for admin+
do $$
declare
  t text;
  tables text[] := array[
    'pipeline_stages','companies','contacts','leads','deals','activities','tasks','notes',
    'integrations','sources','campaigns','events','metrics_daily','customers',
    'revenue_entries','automations','automation_runs','alerts','ai_insights',
    'ai_conversations','ai_messages','diagnostics','reports','audit_logs'
  ];
begin
  foreach t in array tables loop
    execute format('create policy "%I read" on %I for select using (organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));', t, t);
    execute format('create policy "%I insert" on %I for insert with check (has_org_role(array[''owner'',''admin'',''manager'',''sales'',''analyst'']::user_role[]) and organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));', t, t);
    execute format('create policy "%I update" on %I for update using (has_org_role(array[''owner'',''admin'',''manager'',''sales'']::user_role[]) and organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));', t, t);
    execute format('create policy "%I delete" on %I for delete using (has_org_role(array[''owner'',''admin'']::user_role[]) and organization_id in (
  select organization_id
  from memberships
  where user_id = auth.uid()
));', t, t);
  end loop;
end $$;

-- Special: ai_messages via conversation ownership
drop policy if exists "ai_messages read" on ai_messages;
create policy "ai_messages read" on ai_messages for select using (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
drop policy if exists "ai_messages insert" on ai_messages;
create policy "ai_messages insert" on ai_messages for insert with check (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- =====================================================
-- Helper: handle_new_user — create profile on signup
-- =====================================================
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================
-- Helper: get_effective_org — for server-side use
-- =====================================================
create or replace function current_org_id() returns uuid language sql stable as $$
  select organization_id from memberships where user_id = auth.uid() limit 1;
$$;
