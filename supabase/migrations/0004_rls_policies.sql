-- =====================================================
-- CONVERSÃO 360° — RLS policies
-- All tenant-scoped tables restricted to organization members
-- =====================================================

-- This file is a safety net. Policies are also created in 0001.
-- If re-running, use drop+create pattern.

do $$
declare
  t text;
  tables text[] := array[
    'pipeline_stages','companies','contacts','leads','deals','activities','tasks','notes',
    'integrations','sources','campaigns','events','metrics_daily','customers',
    'revenue_entries','automations','automation_runs','alerts','ai_insights',
    'ai_conversations','diagnostics','reports','audit_logs'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;
