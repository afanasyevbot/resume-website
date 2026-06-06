-- Pending Slack interactions: maps a button click / channel reply back to the
-- role + action it was about, so an async response (minutes or days later) can
-- resume the right work. Survives across cron runs.

create table if not exists slack_pending (
  id          bigint generated always as identity primary key,
  role_id     bigint not null references roles(id) on delete cascade,
  kind        text not null,                       -- 'approval' | 'question'
  question    text,                                -- the screening question, when kind='question'
  channel     text,                                -- Slack channel id the message went to
  message_ts  text,                                -- Slack message timestamp (to edit it later)
  status      text not null default 'pending',     -- 'pending' | 'done' | 'skipped'
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists slack_pending_status_idx on slack_pending(status);
create index if not exists slack_pending_role_idx on slack_pending(role_id);
