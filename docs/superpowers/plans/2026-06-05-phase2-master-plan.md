# Phase 2 Master Plan — Full Autonomy

**Date:** 2026-06-05
**Status:** BUILDING

## Build order

1. **Web Research Agent** (~2 hrs) — discover roles from the open web via Tavily
2. **PDF Resume Generation** (~1 hr) — prerequisite for auto-submit
3. **Auto-Submit Agent** (~3-4 hrs) — fill + submit Greenhouse/Ashby forms
4. **Feedback Learning Loop** (~30 min) — feed 👍/👎 ratings into matcher prompt

## Decisions locked

- Email sourcing: SKIPPED (no job alerts set up; can revisit)
- Auto-submit: YES, safe whitelist only (Greenhouse/Ashby standard forms)
- CAPTCHAs / login walls / custom screening → route to manual queue
- Screenshots saved for every auto-submit
- Dry-run mode NOT requested — go live immediately
- $25/mo spend cap already in place
- Browser service: Railway or Fly.io (Playwright container)

## A. Web Research Agent

Tavily search → extract JD → dedupe → score → auto-tailor.
Runs in existing cron alongside ATS sourcing.
Queries rotate daily from a pool derived from Matthew's profile.

## B. PDF Resume Generation

@react-pdf/renderer or jsPDF.
Produces ATS-safe single-column PDF from TailoredPackage.
Stored in application_packages for the auto-submit to attach.

## C. Auto-Submit Agent

Hosted Playwright on Railway ($5/mo).
Vercel → POST to Railway service with {url, name, email, phone, resume_pdf, cover_letter}.
Service fills Greenhouse/Ashby standard forms, detects non-standard → skip.
Returns {success, screenshots, form_type, skipped_reason}.
Persist: status=applied, event, reminders.

## D. Feedback Loop

After ~20 ratings: append recent feedback examples to MATCH_SYSTEM_PROMPT.
Pure prompt engineering, no ML.
