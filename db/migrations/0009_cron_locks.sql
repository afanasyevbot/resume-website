-- Lightweight lease lock so two overlapping cron runs can't both submit (a
-- Vercel retry or a manual trigger firing mid-cron). Claimed atomically via a
-- single INSERT ... ON CONFLICT ... WHERE (works with Neon's stateless HTTP
-- driver, unlike a session-scoped pg_advisory_lock). Auto-expires so a crashed
-- run can't wedge the lock forever.

create table if not exists cron_locks (
  name         text primary key,
  locked_until timestamptz not null
);
