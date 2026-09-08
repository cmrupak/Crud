#!/usr/bin/env node
/**
 * Update the public app-update.json after an EAS APK build.
 *
 * Example:
 *   node scripts/set-app-update.mjs --version 1.0.1 --code 2 --url "https://expo.dev/artifacts/..." --notes "Fixes login"
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function arg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const version = arg('version');
const versionCode = Number(arg('code'));
const apkUrl = arg('url');
const notes = arg('notes', 'Bug fixes and improvements.');
const force = arg('force', 'false') === 'true';

if (!version || !Number.isFinite(versionCode) || versionCode < 1 || !apkUrl) {
  console.error(
    'Usage: node scripts/set-app-update.mjs --version 1.0.1 --code 2 --url "https://..." [--notes "..."] [--force true]',
  );
  process.exit(1);
}

const payload = {
  version,
  versionCode,
  apkUrl,
  notes,
  force,
};

const out = resolve(process.cwd(), 'apps/web/public/app-update.json');
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${out}`);
console.log(payload);
console.log('\nNext: bump apps/mobile/app.json version + android.versionCode to match, rebuild if needed, then git push.');
