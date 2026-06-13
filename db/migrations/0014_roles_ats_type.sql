-- Normalized ATS platform per role, so the apply cron can gate on a CAPABILITY
-- check ("is there a submitter for this ats_type?") instead of brittle URL
-- substring matching. Before this, the cron's `url like '%greenhouse.io%'`
-- filter silently dropped every Lever/Workday/unknown role: it was tailored
-- (cost spent) then never picked up and never routed to manual review — it just
-- sat 'tailored' forever, invisible to Matthew.
--
-- Backfill mirrors atsTypeFromUrl() in lib/engine/ats/capability.ts. Keep the
-- two in sync if either changes.
alter table roles add column if not exists ats_type text;

update roles set ats_type = case
  when url like '%greenhouse.io%'       then 'greenhouse'
  when url like '%ashbyhq.com%'         then 'ashby'
  when url like '%lever.co%'            then 'lever'
  when url like '%myworkdayjobs.com%'   then 'workday'
  when url like '%.workday.com%'        then 'workday'
  when url like '%smartrecruiters.com%' then 'smartrecruiters'
  when url like '%icims.com%'           then 'icims'
  when url like '%jobvite.com%'         then 'jobvite'
  when url like '%taleo.net%'           then 'taleo'
  when url like '%successfactors.com%'  then 'successfactors'
  when url like '%breezy.hr%'           then 'breezy'
  when url like '%applytojob.com%'      then 'applytojob'
  else null
end
where ats_type is null;
