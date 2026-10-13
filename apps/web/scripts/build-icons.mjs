import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

/**
 * Generates the PWA icon set from one vector: the wordmark's ink dot on paper.
 * Run once (`node scripts/build-icons.mjs`); the PNGs are committed.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'public', 'icons');
mkdirSync(out, { recursive: true });

function svg(size, { maskable }) {
  const pad = maskable ? size * 0.2 : size * 0.12;
  const inner = size - pad * 2;
  const r = inner * 0.5;
  const cx = size / 2;
  const cy = size / 2;
  // A nib: a rounded square of paper with a single ink dot, calm and recognisable at 48 px.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.22}" fill="#faf9f6"/>
  <path d="M${cx - r * 0.55} ${cy + r * 0.62} L${cx + r * 0.08} ${cy - r * 0.62} L${cx + r * 0.55} ${cy - r * 0.62} L${cx - r * 0.08} ${cy + r * 0.62} Z" fill="#2f4a6b" opacity="0.92"/>
  <circle cx="${cx + r * 0.52}" cy="${cy + r * 0.5}" r="${r * 0.17}" fill="#2f4a6b"/>
</svg>`;
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-192.png', 192, true],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
  ['badge-72.png', 72, true],
];

for (const [name, size, maskable] of targets) {
  const png = await sharp(Buffer.from(svg(size, { maskable })))
    .png()
    .toBuffer();
  writeFileSync(join(out, name), png);
}
writeFileSync(join(out, 'icon.svg'), svg(512, { maskable: false }));
const favicon = await sharp(Buffer.from(svg(64, { maskable: false })))
  .png()
  .toBuffer();
writeFileSync(join(root, 'app', 'favicon.ico'), favicon);
console.warn(`wrote ${targets.length + 2} icons`);
