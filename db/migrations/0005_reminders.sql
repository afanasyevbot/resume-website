-- LinkedIn follow-up reminders, auto-created on Mark Applied.
-- Engine NEVER auto-sends outreach — reminders only NOTIFY Matthew, who
-- composes and sends manually via the linkedin search link.
create table if not exists reminders (
  id              bigint generated always as identity primary key,
  role_id         bigint not null references roles(id) on delete cascade,
  kind            text not null check (kind in ('linkedin_follow_up','linkedin_check_in','send_outreach')),
  due_at          timestamptz not null,
  completed_at    timestamptz,
  snoozed_until   timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists reminders_pending_idx on reminders (completed_at, due_at) where completed_at is null;
create index if not exists reminders_role_idx on reminders (role_id);
