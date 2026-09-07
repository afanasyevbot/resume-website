#!/usr/bin/env node
/**
 * Deploy full source tree to Vercel production via API + OIDC token.
 * Used when git remote is Origin-only and CLI credentials are unavailable.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname;
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.vercel',
  'coverage',
  '.turbo',
]);
const SKIP_FILES = new Set(['.DS_Store']);

function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (SKIP_FILES.has(entry)) continue;
    const st = statSync(full);
    if (st.isDirectory()) collectFiles(full, files);
    else files.push(rel);
  }
  return files;
}

function isBinary(buf) {
  const sample = buf.subarray(0, Math.min(buf.length, 8000));
  return sample.includes(0);
}

const token = process.env.VERCEL_OIDC_TOKEN;
const teamId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !teamId || !projectId) {
  console.error('Missing VERCEL_OIDC_TOKEN, VERCEL_ORG_ID, or VERCEL_PROJECT_ID');
  process.exit(1);
}

const paths = collectFiles(ROOT).sort();
console.log(`Packaging ${paths.length} files...`);

const fileEntries = paths.map((file) => {
  const buf = readFileSync(join(ROOT, file));
  const binary = isBinary(buf);
  return {
    file,
    data: binary ? buf.toString('base64') : buf.toString('utf8'),
    encoding: binary ? 'base64' : 'utf-8',
  };
});

const payload = {
  name: 'matthew-portfolio',
  project: projectId,
  target: 'production',
  files: fileEntries,
};

console.log('Creating production deployment...');
const res = await fetch(`https://api.vercel.com/v13/deployments?teamId=${teamId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const body = await res.json();
if (!res.ok) {
  console.error('Deploy failed:', res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}

const deploymentId = body.id;
const url = body.url ? `https://${body.url}` : body.alias?.[0];
console.log('Deployment created:', deploymentId);
console.log('URL:', url);
console.log('Inspector:', `https://vercel.com/deployments/${deploymentId}`);

// Poll until ready or error
const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 8000));
  const statusRes = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const status = await statusRes.json();
  const state = status.readyState ?? status.state;
  console.log(`Status: ${state}`);
  if (state === 'READY') {
    console.log('Production deploy READY');
    console.log('Aliases:', (status.alias ?? []).join(', '));
    process.exit(0);
  }
  if (state === 'ERROR' || state === 'CANCELED') {
    console.error('Deploy failed:', JSON.stringify(status, null, 2));
    process.exit(1);
  }
}

console.error('Timed out waiting for deployment');
process.exit(1);
