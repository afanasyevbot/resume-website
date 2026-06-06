# Official Playwright image — Chromium + all system deps preinstalled.
# Tag MUST match the playwright version in package.json (1.60.0) so the
# bundled browser binaries line up with the npm package.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

# Install production deps against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source (node_modules and .env are excluded via .dockerignore).
COPY index.js answer.js ./

ENV NODE_ENV=production
# Railway injects PORT at runtime; index.js reads process.env.PORT.
EXPOSE 8080
CMD ["node", "index.js"]
