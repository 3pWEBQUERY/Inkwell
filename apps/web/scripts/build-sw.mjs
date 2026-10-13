import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

/**
 * Bundles sw.ts with a precache manifest of the files in public/ (icons,
 * fonts, manifest) plus the shell routes. Runs before `next build`.
 * Build-tool independent on purpose: it works with Turbopack and Webpack alike.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const assets = walk(publicDir)
  .filter(
    (file) => !file.endsWith('sw.js') && !file.endsWith('sw.js.map') && !file.endsWith('.txt'),
  )
  .map((file) => ({
    url: `/${relative(publicDir, file).split('\\').join('/')}`,
    revision: createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16),
  }));

const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? String(Date.now());
const shell = ['/offline', '/today', '/rooms', '/journal', '/me'].map((url) => ({
  url,
  revision: buildId,
}));

await build({
  entryPoints: [join(root, 'sw.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2022'],
  outfile: join(publicDir, 'sw.js'),
  define: {
    'self.__SW_MANIFEST': JSON.stringify([...assets, ...shell]),
    'process.env.NODE_ENV': '"production"',
  },
  logLevel: 'warning',
});
