// Builds docs/maquette/maquette-v1.html: the HTML mockup (one self-contained page) driven by the
// real DStudio renderer, so the mockup shows exactly what the tool produces.
// Usage: npm run mockup
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'node_modules', '.mockup');

await build({
  configFile: join(root, 'vite.config.ts'),
  logLevel: 'warn',
  build: {
    outDir,
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: join(root, 'scripts', 'mockup', 'engine-entry.ts'),
      name: 'DStudio',
      formats: ['iife'],
      fileName: () => 'engine.js',
    },
    rollupOptions: { external: ['@ffmpeg/ffmpeg'], output: { globals: { '@ffmpeg/ffmpeg': '{}' } } },
  },
});

const engine = readFileSync(join(outDir, 'engine.js'), 'utf8');
const template = readFileSync(join(root, 'scripts', 'mockup', 'maquette.template.html'), 'utf8');
const app = readFileSync(join(root, 'scripts', 'mockup', 'mockup.js'), 'utf8');
const html = `${template}<script>\n${engine.replace(/<\/script/gi, '<\\/script')}\n</script>\n<script>\n${app}\n</script>\n`;
const target = join(root, 'docs', 'maquette', 'maquette-v1.html');
writeFileSync(target, html);
console.log(`[mockup] ${target} (${Math.round(html.length / 1024)} KB)`);
