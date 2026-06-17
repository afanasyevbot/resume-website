-- Expand the target-company list with Matthew's 2026-06-16 shortlist, resolved
-- to LIVE Greenhouse/Ashby boards by a job-count probe (only boards returning
-- real openings on a sourceable ATS are included). Idempotent like 0017: on a
-- matching (ats, slug) it refreshes name/active, so re-applying is a no-op.
--
-- Intentionally omitted (not on a sourceable ATS, or slug returned 0 jobs and
-- couldn't be resolved): Doist, Hex, Tiger Data/Timescale, Remitly, Greenlight,
-- Wiz, Snyk, Deel, Remote, Arcadia, Automattic, Gametime, Superside. Several of
-- these (Wiz, Snyk, Deel) are clearly hiring but expose no jobs under the obvious
-- slug — likely Lever/Workday/custom, which the engine can't source yet. Add them
-- in a future migration once a real Greenhouse/Ashby slug is confirmed.
insert into target_companies (name, ats, slug, active) values
  ('Cresta',        'greenhouse', 'cresta',       true),
  ('Arize AI',      'greenhouse', 'arizeai',      true),
  ('GitLab',        'greenhouse', 'gitlab',       true),
  ('Grafana Labs',  'greenhouse', 'grafanalabs',  true),
  ('ClickHouse',    'greenhouse', 'clickhouse',   true),
  ('Honeycomb',     'greenhouse', 'honeycomb',    true),
  ('Mercury',       'greenhouse', 'mercury',      true),
  ('Zocdoc',        'greenhouse', 'zocdoc',       true),
  ('Fleetio',       'greenhouse', 'fleetio',      true),
  ('Supabase',      'ashby',      'supabase',     true),
  ('PostHog',       'ashby',      'posthog',      true),
  ('Vanta',         'ashby',      'vanta',        true),
  ('1Password',     'ashby',      '1password',    true),
  ('Stedi',         'ashby',      'stedi',        true),
  ('Benchling',     'ashby',      'benchling',    true),
  ('Zapier',        'ashby',      'zapier',       true),
  ('Plaid',         'ashby',      'plaid',        true)
on conflict (ats, slug) do update set name = excluded.name, active = excluded.active;
