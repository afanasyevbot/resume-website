-- Core job-engine schema (Phase 1b)

create table if not exists roles (
  id            bigint generated always as identity primary key,
  company       text not null,
  title         text not null,
  url           text,
  location      text,
  jd_text       text,
  source        text,                       -- 'email' | 'ats' | 'research' | 'manual'
  fit_score     integer,                    -- 0-100, from the matcher
  fit_reasons   jsonb,
  segment       text,                       -- 'mid-market' | 'enterprise' | 'unknown'
  ai_native     boolean,
  route         text,                       -- 'tailor' | 'flag' | 'discard'
  status        text not null default 'sourced',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists application_packages (
  id            bigint generated always as identity primary key,
  role_id       bigint not null references roles(id) on delete cascade,
  resume_path   text,
  cover_letter  text,
  outreach_draft text,
  status        text not null default 'draft',
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id            bigint generated always as identity primary key,
  role_id       bigint references roles(id) on delete set null,
  kind          text not null,              -- e.g. 'sourced','scored','tailored','queued','applied'
  detail        jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists roles_status_idx on roles(status);
create index if not exists roles_company_idx on roles(company);
