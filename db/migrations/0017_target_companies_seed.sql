-- Version-control the target-company list. Until now it lived ONLY in the prod
-- DB (created in 0004, hand-patched in 0011/0012), so the repo wasn't the source
-- of truth and the list couldn't be rebuilt from scratch. This is a snapshot of
-- the live list (2026-06-14), idempotent: on a matching (ats, slug) it just
-- refreshes name/active, so applying it to prod is a no-op.
--
-- Going forward: add/repoint companies via a new migration (per the PR-only
-- rule). The sourcing self-heal also repoints `ats` at runtime on a 404 and logs
-- a 'slug_healed' event — if that fires, reconcile it back into a migration so
-- the repo stays the source of truth.
insert into target_companies (name, ats, slug, active) values
  ('Anthropic',        'greenhouse', 'anthropic',   true),
  ('Brex',             'greenhouse', 'brex',        true),
  ('Cohere',           'ashby',      'cohere',      true),
  ('Conga',            'greenhouse', 'conga',       true),
  ('Cursor',           'ashby',      'cursor',      true),
  ('Customer.io',      'greenhouse', 'customerio',  true),
  ('Dandy',            'ashby',      'dandy',       true),
  ('Databricks',       'greenhouse', 'databricks',  true),
  ('Datadog',          'greenhouse', 'datadog',     true),
  ('Deepgram',         'ashby',      'deepgram',    true),
  ('ElevenLabs',       'ashby',      'elevenlabs',  true),
  ('Groq',             'greenhouse', 'groq',        false),
  ('Harvey',           'ashby',      'harvey',      true),
  ('Hatch',            'ashby',      'hatch',       true),
  ('LangChain',        'ashby',      'langchain',   true),
  ('Linear',           'ashby',      'linear',      true),
  ('Mistral',          'lever',      'mistral',     true),
  ('Notion',           'ashby',      'notion',      true),
  ('OpenAI',           'ashby',      'openai',      true),
  ('Perplexity',       'ashby',      'perplexity',  true),
  ('Ramp',             'ashby',      'ramp',        true),
  ('Replit',           'ashby',      'replit',      true),
  ('Scale AI',         'greenhouse', 'scaleai',     true),
  ('Siro',             'ashby',      'siro',        true),
  ('Snowflake',        'ashby',      'snowflake',   true),
  ('Sourcegraph',      'greenhouse', 'sourcegraph', true),
  ('Stampli',          'greenhouse', 'stampli',     false),
  ('Supio',            'greenhouse', 'supio',       false),
  ('Together AI',      'greenhouse', 'togetherai',  true),
  ('UserGems',         'greenhouse', 'usergems',    true),
  ('Vercel',           'greenhouse', 'vercel',      true),
  ('Weights & Biases', 'greenhouse', 'wandb',       false),
  ('Writer',           'ashby',      'writer',      true),
  ('Xometry',          'greenhouse', 'xometry',     true),
  ('Zip',              'ashby',      'zip',         true)
on conflict (ats, slug) do update set name = excluded.name, active = excluded.active;
