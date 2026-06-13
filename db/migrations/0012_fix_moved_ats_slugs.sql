-- 21 of 35 target companies (60%) were returning 404 on every source run —
-- their aggregate "errors: 21" was hiding in the source_run event. Probed each
-- against greenhouse/ashby/lever (2026-06-12) and found nearly all had simply
-- migrated ATS. OpenAI alone had 731 live jobs the engine could never see.
--
-- This migration repoints the moved companies and retires the truly-gone ones.
-- It is data-only and idempotent (each UPDATE keys on the current ats/slug, so
-- re-running is a no-op once applied). No unique(ats,slug) conflicts: every
-- destination pair is currently unused.

-- ── Moved Greenhouse → Ashby, same slug ──────────────────────────────
-- Verified live job counts in parens at migration time.
update target_companies set ats = 'ashby'
where ats = 'greenhouse' and slug in (
  'openai',      -- 731
  'snowflake',   -- 397
  'harvey',      -- 262
  'cohere',      -- 126
  'langchain',   -- 108
  'replit',      -- 99
  'dandy',       -- 91
  'perplexity',  -- 71
  'deepgram',    -- 60
  'writer',      -- 50
  'elevenlabs',  -- 154
  'hatch',       -- 12
  'siro'         -- 11
);

-- ── Cursor: Greenhouse 'anysphere' → Ashby 'cursor' (slug also changed) ──
update target_companies set ats = 'ashby', slug = 'cursor'
where ats = 'greenhouse' and slug = 'anysphere';  -- 100 jobs

-- ── Brex: Ashby → Greenhouse, same slug ──────────────────────────────
update target_companies set ats = 'greenhouse'
where ats = 'ashby' and slug = 'brex';  -- 237 jobs

-- ── Mistral: Greenhouse → Lever ──────────────────────────────────────
-- Lever fetching isn't implemented yet (#10) — fetchListings() skips unknown
-- ATS gracefully, so this is safe: Mistral simply won't be polled until Lever
-- support lands, instead of throwing a 404 every run. Repoint now so the data
-- is correct and #10 lights it up automatically.
update target_companies set ats = 'lever'
where ats = 'greenhouse' and slug = 'mistral';

-- ── Gone entirely (404 on greenhouse, ashby, AND lever) ──────────────
-- Moved to an unsupported careers host (Workday/Rippling/etc.) or renamed.
-- Deactivate so they stop consuming a fetch attempt every run. Re-add as new
-- rows if/when their current board is identified.
update target_companies
set active = false,
    notes = coalesce(notes || ' ', '') || '[deactivated 2026-06-12: 404 on greenhouse/ashby/lever — moved off supported ATS]'
where active = true and slug in ('groq', 'stampli', 'supio', 'wandb');
