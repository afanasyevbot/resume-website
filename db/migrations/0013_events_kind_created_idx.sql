-- The events table is append-only and never pruned; every /engine render runs
-- several ordered scans over it (loadCronHealth's distinct-on-kind, getDeltas,
-- listActivity), and PR #40 adds a per-cron-run heartbeat writer on top. With
-- no index on events, each of those is a full sequential scan + sort that grows
-- with the table forever.
--
-- One composite index covers all three: latest-per-kind (distinct on kind ...
-- order by kind, created_at desc), the kind-filtered 7-day delta counts, and
-- the created_at-ordered activity feed. Pure performance — no behavior change.
create index if not exists events_kind_created_idx on events (kind, created_at desc);
