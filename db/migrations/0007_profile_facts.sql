-- Screening-question answer sheet (single row). Holds the facts the engine is
-- allowed to use when auto-filling application screening questions. Data is
-- seeded out-of-band (NOT in this migration) so salary/demographic info never
-- enters source control.

create table if not exists profile_facts (
  id          int primary key default 1,
  facts       jsonb not null,
  updated_at  timestamptz not null default now(),
  constraint profile_facts_singleton check (id = 1)
);
