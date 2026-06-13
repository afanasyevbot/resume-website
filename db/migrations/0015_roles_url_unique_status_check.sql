-- Two integrity guards on roles the app layer can't reliably enforce.
--
-- 1) Unique URL. Two cron paths (ATS sourcing + web research) can insert the
--    same listing; the in-memory dedup is best-effort and races. A duplicate
--    role means a second Claude scoring call (wasted budget) and a possible
--    double application. Verified zero duplicate URLs in prod before adding, so
--    the index builds cleanly. Partial (url is not null) — null urls (manual
--    entries) are exempt.
--
-- 2) Status CHECK. A typo'd status ('aplied') would insert silently and drop
--    the role out of every status-filtered query forever. This pins status to
--    the known lifecycle. The list MUST match ROLE_STATUSES in
--    lib/engine/statusTypes.ts (a drift-guard test enforces it). All statuses
--    currently in prod (discarded/scored/archived/needs_review/rejected/tailored)
--    are covered, so the constraint validates without rewriting any row.

create unique index if not exists roles_url_uniq on roles (url) where url is not null;

alter table roles drop constraint if exists roles_status_check;
alter table roles add constraint roles_status_check check (
  status in (
    'sourced', 'scored', 'tailored', 'queued',
    'awaiting_approval', 'needs_review',
    'applied', 'discarded', 'archived',
    'responded', 'interviewing', 'offer', 'rejected'
  )
);
