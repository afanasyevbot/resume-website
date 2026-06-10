-- Customer.io reached the pipeline via the aggregator research path (role 96,
-- fit 74 — the engine's strongest match to date) but its stored listing URL
-- went dead. Sourcing only re-finds reposted jobs for companies it polls, so
-- add Customer.io as a first-class greenhouse target.
insert into target_companies (name, ats, slug, notes)
values ('Customer.io', 'greenhouse', 'customerio', 'Added after aggregator-sourced Mid-Market AE (fit 74) URL went stale; native polling re-finds reposts.')
on conflict (ats, slug) do nothing;
