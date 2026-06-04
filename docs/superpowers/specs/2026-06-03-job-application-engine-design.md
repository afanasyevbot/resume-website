# Job Application Engine — Design

**Date:** 2026-06-03
**Owner:** Matthew Afanasiev
**Status:** Design approved — pending written-spec review, then implementation plan
**Home:** `resume-website` repo (relocated out of `_Archive` to active `Projects/`), private auth-gated `/engine/*` routes

---

## 1. Problem & Goal

Matthew is job hunting. Manual applications are slow and response rates are low. He wants an AI agent that **proactively finds matching roles, tailors a complete application package, and applies on his behalf** — giving him recaps and keeping him in control of the irreversible moments.

**Primary goal:** remove the manual *typing* (finding, tailoring, form-filling) while keeping human judgment at the *irreversible submit* and at *all outbound messaging*.

**Success criteria:**
- Agent surfaces live, verified, on-profile roles daily without Matthew searching.
- Each application is tailored (not generic) and clears a quality bar.
- Matthew can clear a day's queue in minutes (batched one-click).
- A safe subset auto-submits with zero clicks (Phase 2).
- Nothing irreversible or reputation-affecting happens without Matthew's action.

## 2. Non-Goals (Hard Lines)

- **No automated LinkedIn messaging/connecting.** Violates LinkedIn's User Agreement and risks restricting his professional network. Outreach is drafted, never auto-sent.
- **No scraping of LinkedIn/Indeed listings.** ToS + bot-detection risk. LinkedIn/Indeed coverage comes only via his own opted-in job-alert emails.
- **No auto-submit to forms with logins, CAPTCHAs, or custom screening questions.** Those route to one-click review.
- **No fabrication.** Tailoring only reframes true experience. Mid-market positioning only — never claim enterprise.

## 3. Matthew's Profile (matcher seed)

- **Role:** Mid-Market / Strategic Account Executive (also founding-AE / GTM). Tech/SaaS sales, ~5 yrs. Mid-market, not enterprise.
- **Positioning (headline):** an AE who *builds* AI systems — working portfolio across his project folders. Rare, credible for AI-forward companies. Every package leads with this and cites a concrete project proof-point.
- **Industry:** B2B technology / SaaS broadly, **strong bias to AI-native** companies — AI agents/LLMs (Anthropic, LangChain, Writer, Rox), voice AI (Deepgram, Siro), data infra (Snowflake, Databricks, Datadog), AI-for-verticals incl. legal (Harvey, Supio, Thomson Reuters), fintech/ops + AI workflow (Ramp, Zip, Stampli, Rillet, Mimica). Legal/tax is one vertical, not the boundary.
- **AI bias (matcher calibration):** AI-native preferred, but still include strong adjacent data/fintech/SaaS roles. Not AI-only.
- **Location:** Minneapolis, MN-based. Remote-first; open to relocation to Chicago, the Carolinas, and Florida.
- **Stage:** any stage — seed founding-AE through public; judge on the role, not the stage.
- **Comp:** ~$170k OTE minimum.
- **Ranking priority:** optimize for best AI company / career trajectory (where the build-AI edge is leverage), over raw comp or raw speed.
- **Seed + training:** content from the job-application-engine Master Profile + base resume; the ~45 tailored resumes/cover letters (source of truth) + the tracker's self-assigned fit scores (stale but useful labels) train the matcher. Refined by 👍/👎 over time.

## 4. Architecture — Pipeline

```
[Source] → [Match & Verify] → [Tailor] → [Route] → [Track / Recap]
```

### 4.1 Source (two engines feeding one queue)
- **Pull (primary — active research):** generate search queries from the profile; run targeted web search (WebSearch / Tavily), poll a maintained **target-company list's** public ATS boards (Greenhouse / Lever / Ashby public job feeds), and scan startup-job sources (HN "Who's Hiring," YC Work at a Startup, Wellfound). Can also research *new* fitting companies and add them to the target list.
- **Push (supplement):** read Matthew's opted-in job-alert emails via the connected Outlook MCP and parse out role + link. This is the safe path for LinkedIn/Indeed coverage.
- All roles deduped against (a) prior-applied companies (from history) and (b) already-seen roles.

### 4.2 Match & Verify
- **Verify first (deterministic):** fetch the actual posting URL; confirm it is live and current. Discard dead/stale links. Search snippets and model-proposed postings are never trusted without a real fetch.
- **Match (LLM judgment):** score the verified JD against the profile → fit score + reason. High fit → tailor. Clear miss → discard (logged for audit). Borderline → flag for Matthew.

### 4.3 Tailor
- Productionize the existing **job-application-engine** logic as a **server-side callable** (today it runs as a Claude skill outputting DOCX/PDF; the engine needs it as a function/route).
- Produces: JD analysis, tailored resume (DOCX + PDF), cover letter, optional outreach draft.
- Enforces the engine's non-negotiables: no em dashes, mid-market only, never fabricate. Leads with the builder-who-sells positioning + a project proof-point.
- **Archetype selection:** pick one of his 3 proven resume formats by company type — (1) classic ATS single-column, (2) "Claude Code" AI-forward sidebar variant, (3) "REVENUE × AI" two-column builder resume (newest, most aggressive). Apply his implicit tailoring rules: rewrite the profile summary with a company-bridge sentence, swap sidebar keywords to JD vocab, toggle the tools block (generic vs. named stack), select stats by context, retitle the headline to the target role.
- **Master-profile lint pass (required):** check every generated doc against the master-profile rules before output — flag/fix enterprise claims, em dashes, forbidden words ("Quarterbacked"), and over-specific API naming. His *historical* resumes violate these, so they are style references, not clean exemplars; the engine must not learn ground-truth facts or compliance from them.

### 4.4 Route (apply on his behalf)
| Tier | Condition | Action |
|---|---|---|
| Auto-apply | On safe whitelist (Greenhouse/Lever/Ashby + simple career forms; no login, no CAPTCHA, no custom screening) | Fill + submit automatically (Phase 2) |
| One-click | Everything else (logins, CAPTCHAs, custom screening, off-whitelist) | Fill everything + attach docs, queue for Matthew's one click |
| Draft only | LinkedIn/Indeed Easy Apply + all outreach | Draft; Matthew sends |

### 4.5 Track / Recap
- Every role logged through its lifecycle (sourced → verified → scored → tailored → applied/queued/discarded → response).
- Daily recap (dashboard + optional email digest): N auto-applied, N awaiting your click, N drafts to send, responses logged.
- Matthew logs responses → feeds the preference-learning loop.

## 5. Submission Runtime

**Choice: C (hybrid), built as a swappable adapter.**
- Cloud does sourcing / matching / tailoring / queueing 24/7 (no logins needed — reads public boards + his inbox via MCP).
- **Submission runs through Matthew's local browser** (Claude-in-Chrome) in batches — his real session, lowest detection/ban risk.
- Adapter interface lets us later swap to A (fully local) or B (cloud headless w/ stored session) via config, without rebuilding.

## 6. Data Model (initial)

- **profile** — structured preference profile (titles, segment, industries, comp floor, locations/remote, deal-breakers, free-text thesis).
- **roles** — source, company, title, url, jd_text, verified_live (bool), fit_score, fit_reason, status, timestamps.
- **application_packages** — role_id, resume_paths, cover_letter, outreach_draft, status.
- **events** — append-only log of every pipeline action (for recaps + audit).
- **target_companies** — maintained list driving the pull engine.
- Postgres (Neon or Supabase — both available).

## 7. Failure Handling & Guardrails

- **Low model confidence** on match or tailoring → never auto-submits; routes to one-click queue.
- **CAPTCHA / login / changed form** mid-submit → stop, screenshot, route to manual with reason.
- **Pacing / rate limits** on sourcing and submission so behavior never looks like a spam bot.
- **Malformed AI output** → fail safe to manual review, never auto-action.
- **Dedup guard** → never re-apply to a company already in history.

## 8. Evals (gate for auto-submit)

Auto-submit (Phase 2) stays OFF until:
- **Matcher eval:** Matthew labels a batch of the agent's picks (good fit / not); accuracy must clear a bar.
- **Tailoring eval:** Matthew grades a sample of tailored resumes + cover letters for quality and truthfulness.
- **Form-fill eval:** dry-run submissions on whitelist forms verified correct before any live auto-submit.

## 9. Security

- Public `/` resume-query page stays public.
- Private `/engine/*` behind single-user auth (magic-link or password gated to Matthew's email).
- Automation, secrets, and any session data live server-side; never shipped to the client.
- Trust boundary: public read-only content vs. authenticated actions + private data.

## 10. Phasing

- **Phase 1 (highest leverage, lowest risk):** Source (pull + push) → Verify → Match → Tailor → **one-click queue** → recaps + history ingestion. No auto-submit. Delivers most of the time savings immediately.
- **Phase 2:** turn on auto-submit for the safe whitelist, gated by Section 8 evals.
- **Phase 3:** outreach drafts + response tracking + preference-learning loop.

## 11. Existing Assets & Data Sources

- **App:** `resume-website` — Next.js + @anthropic-ai/sdk, deployed on Vercel. Currently in `~/Documents/_Archive/` (relocate to active `Projects/` as implementation step 1).
- **History (source of truth):** `~/Documents/Job Search/` — `Resumes/_by-company` (~45 tailored resumes) + `Cover Letters/` (14). These folders are the authoritative, complete record of where he's applied (broader than the tracker). `Research & Prep/job_application_tracker_v5.html` is a **stale partial snapshot** (16 apps, ~1 month old) — use it only for the self-assigned fit-score labels it contains. Seeds matcher + dedup.
- **Engine:** `job-application-engine.skill` (packaged) + `Job_Application_Engine_Instructions.md` + base resume DOCX + Master Profile MD.

## 12. Open Questions (for implementation planning)

- Auth mechanism: magic-link vs. simple password gate.
- DB: Neon vs. Supabase (both connected).
- Email digest in Phase 1, or dashboard-only to start?
- Format/parser for ingesting the HTML tracker's embedded `CANONICAL` / `merged` arrays.
- Maintained target-company list: seed manually vs. agent-discovered first.
- **Canonical fact sheet (data hygiene) — do before the engine generates anything:** historical resumes disagree on canonical facts. **Decided: tenure = 5 years (lead with it).** Still to lock: AI-system count (5 vs 6) and Fidelis URL (fidelis-dashboard.vercel.app vs fidelispulse.com vs fidelisstrategy.net). Lock these in the Master Profile so inconsistencies don't propagate.
