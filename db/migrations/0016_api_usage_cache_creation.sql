-- Cache-WRITE tokens were never recorded, so cost was under-reported and the
-- $25/mo cap (the only autonomous-spend backstop) ran against a number that was
-- too low. Anthropic bills cache_creation_input_tokens at 1.25× input; this
-- column captures them so cost_cents (and the cap) reflect real spend.
alter table api_usage add column if not exists cache_creation_tokens integer not null default 0;
