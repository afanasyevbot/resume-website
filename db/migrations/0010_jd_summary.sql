-- Add a short AI-generated summary for each role, shown on the dashboard card.
alter table roles add column if not exists jd_summary text;
