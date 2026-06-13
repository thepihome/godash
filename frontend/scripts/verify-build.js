#!/usr/bin/env node
/**
 * Fail CI if index.html references JS/CSS files that are not in the build output.
 * Prevents blank-page deploys where the shell loads but bundles 404 → SPA fallback.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('verify-build: missing build/index.html — run npm run build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const assetPattern = /\/(static\/[^"'\s]+)/g;
const referenced = [...new Set([...html.matchAll(assetPattern)].map((m) => m[1]))];
const missing = referenced.filter((asset) => !fs.existsSync(path.join(buildDir, asset)));

if (missing.length > 0) {
  console.error('verify-build: index.html references assets not present in build/:');
  missing.forEach((asset) => console.error(`  - ${asset}`));
  process.exit(1);
}

console.log(`verify-build: OK (${referenced.length} assets referenced)`);
