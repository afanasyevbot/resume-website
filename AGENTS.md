<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment (matthew-portfolio / mafanasiev.me)

**Vercel project:** `matthew-portfolio` (`prj_IvJbf7jd57XowquD47XHSwLijkPz`)

### Source of truth

Production deploys come from **Cursor Origin only** — not GitHub.

| Remote | URL | Role |
|--------|-----|------|
| `cursor-origin` | `https://origin.cursor.com/fidelis/resume-website.git` | **Deploy trigger** — push here to ship |
| `origin` | GitHub `afanasyevbot/resume-website` | Mirror/backup only — does **not** trigger `matthew-portfolio` builds |

### How to deploy

1. Merge or commit changes on `main`.
2. Push to Origin from an authenticated Cursor session:
   ```bash
   git push cursor-origin main
   ```
3. Vercel auto-builds and promotes to production (`mafanasiev.me`).

### Do not use for production deploys

- **MCP `deploy_to_vercel`** — payload exceeds tool limits (~100 KB); uploads are incomplete and builds fail or ship empty apps.
- **GitHub push to `origin`** — wrong remote for this Vercel project.
- **Vercel CLI / REST API from cloud agents** — no valid deploy credentials in that environment.
- **Empty "trigger deploy" commits** — they never reach Origin.

### If production is broken

1. Open [matthew-portfolio deployments](https://vercel.com/afanasyevbots-projects/matthew-portfolio).
2. Find the last **READY** deployment with `source: git` and full route list (not a `/404`-only build).
3. **Promote to Production** or use Instant Rollback.
4. Then push the fix to `cursor-origin main` for a proper rebuild.

### Local verification before pushing

```bash
npm run build
```
