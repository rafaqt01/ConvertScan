-- =====================================================
-- 0005 — Realtime publication
-- =====================================================
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table ai_messages;
alter publication supabase_realtime add table automation_runs;
