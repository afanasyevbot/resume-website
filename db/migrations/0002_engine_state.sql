-- Single-row state table to track "since last seen" for the engine dashboard.
create table if not exists engine_state (
  id            int primary key default 1 check (id = 1),
  last_seen_at  timestamptz not null default now(),
  prev_seen_at  timestamptz
);

insert into engine_state (id) values (1) on conflict do nothing;
