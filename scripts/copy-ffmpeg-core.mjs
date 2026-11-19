// Copies the ffmpeg.wasm core into public/ so the site serves it itself (no CDN at runtime).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const dest = join(root, 'public', 'ffmpeg');

if (!existsSync(src)) {
  console.warn('[copy-ffmpeg-core] @ffmpeg/core not installed yet, skipping.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  cpSync(join(src, file), join(dest, file));
}
console.log('[copy-ffmpeg-core] ffmpeg core copied to public/ffmpeg');
