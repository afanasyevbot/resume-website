<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment (mafanasiev.me)

**Production Vercel project:** `resume-website` (`prj_gzv5RoRXEHbt2UG5hE3VudnIXPGK`)  
**Domains:** `mafanasiev.me`, `www.mafanasiev.me`

Legacy project `matthew-portfolio` (`prj_IvJbf7jd57XowquD47XHSwLijkPz`) is linked to Cursor Origin but no longer serves the custom domain.

### How to deploy (current)

1. Merge or commit changes on `main`.
2. Push to GitHub:
   ```bash
   git push origin main
   ```
3. Vercel auto-builds `resume-website` and promotes to production.

### Optional: keep Origin in sync

`matthew-portfolio` still deploys from Cursor Origin if you need that path:

```bash
origin auth login          # once, from Cursor Desktop terminal
git pull cursor-origin main --no-rebase
git push cursor-origin main
```

### Do not use for production deploys

- **MCP `deploy_to_vercel`** — payload exceeds tool limits (~100 KB); uploads are incomplete and builds fail or ship empty apps.
- **Vercel CLI / REST API from cloud agents** — OIDC tokens are read-only; no rollback/promote from cloud agents.

### If production is broken

1. Open [resume-website deployments](https://vercel.com/afanasyevbots-projects/resume-website).
2. Find the last **READY** production deploy from GitHub `main` with a full route list.
3. **Promote to Production** or push a fix to `origin main`.

### Local verification before pushing

```bash
npm run build
```
