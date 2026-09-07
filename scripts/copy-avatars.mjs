import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'avatars/id');
const dest = resolve(root, 'apps/web/public/avatars');

if (!existsSync(src)) {
  console.error('Missing avatars/id — cannot copy for Netlify static hosting');
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied avatars → ${dest}`);
