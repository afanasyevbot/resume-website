/**
 * Slack Web API client (bot token) for two-way messaging. Used to post
 * interactive messages (buttons) and edit them in place ("✅ Applied").
 * Best-effort + env-gated like notify.ts — a Slack failure never breaks a run.
 */
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN
export const SLACK_CHANNEL = process.env.SLACK_CHANNEL_ID || '#job-engine'

interface PostResult {
  ok: boolean
  ts?: string
  channel?: string
}

/** Post a message (optionally with Block Kit blocks). Returns the message ts so
 *  it can be edited later. */
export async function postSlackMessage(text: string, blocks?: unknown[], channel = SLACK_CHANNEL): Promise<PostResult> {
  if (!BOT_TOKEN) return { ok: false }
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${BOT_TOKEN}` },
      body: JSON.stringify({ channel, text, blocks }),
    })
    const j = (await res.json()) as { ok: boolean; ts?: string; channel?: string }
    return { ok: !!j.ok, ts: j.ts, channel: j.channel }
  } catch {
    return { ok: false }
  }
}

/** Edit an existing message in place (e.g. swap buttons for "✅ Applied"). */
export async function updateSlackMessage(channel: string, ts: string, text: string, blocks?: unknown[]): Promise<void> {
  if (!BOT_TOKEN) return
  try {
    await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${BOT_TOKEN}` },
      body: JSON.stringify({ channel, ts, text, blocks }),
    })
  } catch {
    /* best-effort */
  }
}

/** Reply via Slack's response_url (valid ~30 min after an interaction). */
export async function respondViaUrl(responseUrl: string, text: string, replaceOriginal = false): Promise<void> {
  try {
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, replace_original: replaceOriginal }),
    })
  } catch {
    /* best-effort */
  }
}
