<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment (mafanasiev.me)

**Production Vercel project:** `matthew-portfolio` (`prj_IvJbf7jd57XowquD47XHSwLijkPz`)  
**Git source:** Cursor Origin — `fidelis/resume-website`  
**Domains:** `mafanasiev.me`, `www.mafanasiev.me` (must be attached to `matthew-portfolio`, not `resume-website`)

### Source of truth

Production deploys come from **Cursor Origin only** — not GitHub.

| Remote | URL | Role |
|--------|-----|------|
| `cursor-origin` | `https://origin.cursor.com/fidelis/resume-website.git` | **Deploy trigger** — push here to ship |
| `origin` | GitHub `afanasyevbot/resume-website` | Backup/mirror only — does **not** trigger `matthew-portfolio` production |

### How to deploy

1. Commit changes on `main`.
2. From **Cursor Desktop** (not the cloud agent terminal):
   ```bash
   origin auth login   # once
   git push cursor-origin main
   ```
3. Vercel builds `matthew-portfolio` and promotes to production.

GitHub push (`git push origin main`) is optional for backup; it does not deploy `mafanasiev.me`.

### First-time Origin setup (local Mac)

```bash
cd ~/resume-website
git remote add cursor-origin https://origin.cursor.com/fidelis/resume-website.git
origin auth login
git push cursor-origin main
```

### Do not use for production deploys

- **MCP `deploy_to_vercel`** — payload exceeds tool limits (~100 KB); incomplete uploads break builds.
- **GitHub → `resume-website` Vercel project** — separate project; must not own `mafanasiev.me` if using Origin-only.
- **Vercel CLI / REST API from cloud agents** — OIDC tokens are read-only (no rollback/promote/alias).

### If production is broken

1. Open [matthew-portfolio deployments](https://vercel.com/afanasyevbots-projects/matthew-portfolio).
2. Find the last **READY** deploy with `source: git` and Cursor Origin metadata (full route list, not `/404` only).
3. **Promote to Production**.
4. Confirm domains are on `matthew-portfolio` under **Settings → Domains**.

### Local verification before pushing

```bash
npm run build
```
