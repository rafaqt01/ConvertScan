-- =====================================================
-- 0003 — Row-level security + materialized view for funnel
-- =====================================================
create or replace view public.v_funnel_summary as
select
  e.organization_id,
  date_trunc('day', e.occurred_at)::date as date,
  count(*) filter (where e.event_type = 'pageview') as sessions,
  count(*) filter (where e.event_type = 'lead') as leads,
  count(*) filter (where e.event_type = 'opportunity') as opportunities,
  count(*) filter (where e.event_type = 'deal_won') as customers,
  coalesce(sum(e.value) filter (where e.event_type = 'revenue'), 0) as revenue
from public.events e
group by e.organization_id, date_trunc('day', e.occurred_at)::date;

grant select on public.v_funnel_summary to authenticated;

-- =====================================================
-- 0004 — Refresh metrics cron helper
-- =====================================================
create or replace function refresh_daily_metrics(p_org_id uuid, p_date date) returns void language plpgsql security definer as $$
begin
  insert into metrics_daily as md (organization_id, source_id, campaign_id, date, sessions, leads_count, opportunities_count, deals_won_count, revenue, spend)
  select
    p_org_id,
    e.source_id,
    e.campaign_id,
    p_date,
    count(*) filter (where e.event_type = 'pageview'),
    count(*) filter (where e.event_type = 'lead'),
    count(*) filter (where e.event_type = 'opportunity'),
    count(*) filter (where e.event_type = 'deal_won'),
    coalesce(sum(e.value) filter (where e.event_type = 'revenue'), 0),
    coalesce(sum(e.value) filter (where e.event_type = 'spend'), 0)
  from events e
  where e.organization_id = p_org_id and e.occurred_at::date = p_date
  group by e.source_id, e.campaign_id
  on conflict (organization_id, source_id, campaign_id, date) do update set
    sessions = excluded.sessions,
    leads_count = excluded.leads_count,
    opportunities_count = excluded.opportunities_count,
    deals_won_count = excluded.deals_won_count,
    revenue = excluded.revenue,
    spend = excluded.spend;
end;
$$;
