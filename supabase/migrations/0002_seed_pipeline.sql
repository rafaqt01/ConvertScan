-- =====================================================
-- Seed: default pipeline stages for new organizations
-- =====================================================
create or replace function seed_default_pipeline() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into pipeline_stages (organization_id, name, position, color, probability) values
    (new.id, 'Lead',         1, '#8A8A9E', 5),
    (new.id, 'Qualificado',  2, '#1A1AFF', 20),
    (new.id, 'Reunião',      3, '#7B61FF', 40),
    (new.id, 'Proposta',     4, '#FFB800', 60),
    (new.id, 'Negociação',   5, '#00C2FF', 80),
    (new.id, 'Fechado',      6, '#00E5A0', 100);
  update pipeline_stages set is_won = true where organization_id = new.id and name = 'Fechado';

  insert into workspaces (organization_id, name, slug, is_default)
  values (new.id, 'Principal', 'principal', true);
  return new;
end;
$$;

create trigger on_organization_created
  after insert on organizations
  for each row execute function seed_default_pipeline();
