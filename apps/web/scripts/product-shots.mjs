/**
 * Product screenshots for the landing page, taken from the running app so the
 * landing page never shows a mock-up. Needs api + web running locally with
 * E2E_MAILBOX=1 on the api (sign-in codes are read from /dev/mailbox).
 *
 *   BASE=http://localhost:3000 node scripts/product-shots.mjs
 *   SCHEME=dark BASE=http://localhost:3000 node scripts/product-shots.mjs
 *
 * Writes editor-desktop, editor-mobile and step-1..4 (plus `-dark` variants)
 * into public/images. PLAYWRIGHT_CHROMIUM_PATH selects a pre-installed Chromium.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE ?? 'http://localhost:3001';
const MAILBOX = process.env.MAILBOX ?? 'http://127.0.0.1:4000/dev/mailbox';
const OUT = process.argv[2] ?? fileURLToPath(new URL('../public/images', import.meta.url));
const SCHEME = process.env.SCHEME ?? 'light';
const SUFFIX = SCHEME === 'dark' ? '-dark' : '';
const STATE = join(tmpdir(), 'inkwell-product-shots-state.json');
const HIDE_DEV = () => {
  const style = document.createElement('style');
  style.textContent = 'nextjs-portal{display:none!important}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
};

async function code(email) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAILBOX}?to=${encodeURIComponent(email)}`);
    if (r.ok) return (await r.json()).code;
    await new Promise((res) => setTimeout(res, 300));
  }
  throw new Error('no code');
}

async function register(page, email, pseudonym) {
  await page.goto(`${BASE}/sign-in?intent=create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Mit E-Mail fortfahren' }).click();
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  const c = await code(email);
  for (const [i, d] of c.split('').entries())
    await page.getByLabel(`Sechsstelliger Code ${i + 1}`).fill(d);
  await page.getByRole('button', { name: 'Ja' }).click();
  await page.getByLabel('Pseudonym').fill(pseudonym);
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel(/Ich verstehe/).check();
  await page.getByRole('button', { name: 'Ich habe ihn gesichert' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.waitForURL(/\/write/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
}

/** Clip a 16:10 window around an element, kept inside the viewport. */
async function clip16x10(page, locator, { pad = 24, minWidth = 520, top } = {}) {
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  let width = Math.max(minWidth, box.width + pad * 2);
  let height = width / 1.6;
  if (box.height + pad * 2 > height) {
    height = box.height + pad * 2;
    width = height * 1.6;
  }
  let x = box.x + box.width / 2 - width / 2;
  let y = top ?? box.y - pad;
  x = Math.max(0, Math.min(x, vp.width - width));
  y = Math.max(0, Math.min(y, vp.height - height));
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

const TITLE = 'Der letzte Zug';
const STORY = [
  'Sie hatte den Zug schon dreimal verpasst, immer absichtlich. Beim vierten Mal stand er einfach da, Türen offen, und wartete, als hätte er Zeit.',
  'Der Bahnsteig roch nach Regen und nach dem Kaffee aus dem Automaten, den niemand mehr trank. Sie zählte die Wagen, obwohl sie wusste, wie viele es waren.',
  'Vielleicht, dachte sie, ist das der ganze Trick: dass man irgendwann einsteigt, ohne zu wissen, wohin. Und dass das reicht.',
];
const NIGHT = [
  'Drei Uhr. Die Strasse unten ist leer, und ich weiss nicht, ob ich müde bin oder nur leise.',
  'Ich schreibe das hier, damit es irgendwo ist, das nicht ich bin.',
];

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
const stamp = Date.now().toString(36).slice(-5);

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'de-CH',
  colorScheme: SCHEME,
});
await ctx.addInitScript(HIDE_DEV);
const page = await ctx.newPage();
await register(page, `shots-${stamp}@example.ch`, `stille.birke${stamp}`);

// 1. Editor with a short story.
await page.getByRole('button', { name: 'Titel ein/aus' }).first().click();
await page.getByLabel('Titel', { exact: true }).fill(TITLE);
await page.locator('.tiptap').click();
for (const [i, paragraph] of STORY.entries()) {
  if (i > 0) await page.keyboard.press('Enter');
  await page.keyboard.type(paragraph, { delay: 0 });
}
await page.mouse.move(10, 890);
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/editor-desktop${SUFFIX}.png` });
const writing = page.locator('.full-editor .max-w-\\[680px\\]').first();
const titleBox = await page.getByLabel('Titel', { exact: true }).boundingBox();
await page.screenshot({
  path: `${OUT}/step-1${SUFFIX}.png`,
  clip: await clip16x10(page, writing, { pad: 32, top: titleBox.y - 44 }),
});

// 2. Completion panel: visibility.
await page.getByRole('button', { name: 'Fertig' }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Gedanke' }).click();
await page.waitForTimeout(300);
const visibility = page.locator('fieldset').nth(1);
await page.screenshot({
  path: `${OUT}/step-2${SUFFIX}.png`,
  clip: await clip16x10(page, visibility, { pad: 20, minWidth: 440 }),
});
await page.getByRole('button', { name: 'Im Heft ablegen' }).click();
await page.waitForURL(/\/journal/);

// 3. Share a thought anonymously in "Nachts": room and expiry.
await page.goto(`${BASE}/rooms/nachts`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'Beitreten' }).first().click();
await page.waitForTimeout(800);
await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.locator('.tiptap').click();
await page.keyboard.type(NIGHT.join(' '));
await page.getByRole('button', { name: 'Fertig' }).click();
await page
  .getByRole('button', { name: /Anonym teilen/ })
  .first()
  .click();
await page.getByRole('button', { name: 'Nachts' }).click();
await page.waitForTimeout(500);
const roomAndExpiry = page.locator('fieldset').nth(2);
await page.screenshot({
  path: `${OUT}/step-3${SUFFIX}.png`,
  clip: await clip16x10(page, roomAndExpiry, { pad: 20, minWidth: 440 }),
});
await page.getByRole('button', { name: 'Anonym teilen' }).last().click();
await page.waitForURL(/\/rooms\/nachts/);
await page.waitForTimeout(800);
await ctx.storageState({ path: STATE });

// A second person reads and reacts.
{
  const readerCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'de-CH',
    colorScheme: SCHEME,
  });
  const reader = await readerCtx.newPage();
  await register(reader, `reader-${stamp}@example.ch`, `leise.amsel${stamp}`);
  await reader.getByRole('button', { name: 'Später' }).click();
  await reader.goto(`${BASE}/rooms/nachts`, { waitUntil: 'networkidle' });
  await reader.waitForTimeout(800);
  await reader.getByText(NIGHT[0].slice(0, 20)).first().click();
  await reader.waitForURL(/\/posts\//);
  await reader.waitForTimeout(600);
  await reader.getByRole('button', { name: 'fühl ich' }).click();
  await reader.getByRole('button', { name: 'danke' }).click();
  await reader.mouse.wheel(0, 2000);
  await reader.waitForTimeout(1500);
  await readerCtx.close();
}

// 4. The author's feedback, only numbers they see.
await page.goto(`${BASE}/me`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const feedback = page.locator('section[aria-labelledby="feedback"]');
await page.screenshot({
  path: `${OUT}/step-4${SUFFIX}.png`,
  clip: await clip16x10(page, feedback, { pad: 28, minWidth: 600 }),
});
await ctx.close();

// Phone: the same night text in the editor.
{
  const phone = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'de-CH',
    colorScheme: SCHEME,
    storageState: STATE,
  });
  await phone.addInitScript(HIDE_DEV);
  const p = await phone.newPage();
  await p.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const discard = p.getByRole('button', { name: 'Neu anfangen' });
  if (await discard.isVisible().catch(() => false)) await discard.click();
  await p.locator('.tiptap').click();
  await p.keyboard.type(NIGHT[0]);
  await p.keyboard.press('Enter');
  await p.keyboard.type(NIGHT[1]);
  await p.locator('.tiptap').evaluate((el) => el.blur());
  await p.waitForTimeout(600);
  await p.screenshot({
    path: `${OUT}/editor-mobile${SUFFIX}.png`,
    clip: { x: 0, y: 0, width: 390, height: 664 },
  });
  await phone.close();
}

await browser.close();
console.log('done');
