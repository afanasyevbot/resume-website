-- Target companies the sourcing agent will poll for new openings.
-- One row per (ats, slug). Manually curated for now; future UI will manage.
create table if not exists target_companies (
  id            bigint generated always as identity primary key,
  name          text not null,
  ats           text not null check (ats in ('greenhouse','ashby','lever')),
  slug          text not null,           -- e.g. 'anthropic' for boards-api.greenhouse.io/v1/boards/anthropic
  notes         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (ats, slug)
);
