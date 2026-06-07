-- Track every Claude API call for cost monitoring + hard monthly cap.
create table if not exists api_usage (
  id              bigint generated always as identity primary key,
  kind            text not null,           -- 'score' | 'tailor' | 'tailor_retry' | 'research' | 'lookalike'
  model           text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  cached_tokens   integer not null default 0,
  cost_cents      numeric(10,4) not null default 0,
  role_id         bigint references roles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists api_usage_month_idx on api_usage (created_at);
