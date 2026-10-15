import { expect, test } from '@playwright/test';

import { register, uniqueEmail } from './helpers';

const stamp = Date.now().toString(36).slice(-6);
const pseudonym = `e2e.${stamp}`;
const nightText = `Heute Nacht ${stamp} ist es still, und ich schreibe es auf, damit es irgendwo ist.`;

test.describe('core flows', () => {
  test('registers in under a minute and lands in the editor', async ({ page }) => {
    await register(page, uniqueEmail(), pseudonym);
    await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
    await page.getByRole('button', { name: 'Später' }).click();
    await expect(page).toHaveURL(/\/today/);
  });

  test('writes a private entry that is stored encrypted', async ({ page }) => {
    await register(page, uniqueEmail(), `${pseudonym}p`);
    await page.locator('.tiptap').fill('Ein privater Gedanke, nur für mich.');
    await page.getByRole('button', { name: 'Fertig' }).click();
    await page.getByRole('button', { name: 'Im Heft ablegen' }).click();
    await expect(page).toHaveURL(/\/journal/);
    await expect(page.getByText('Ein privater Gedanke, nur für mich.').first()).toBeVisible();
  });

  test('shares anonymously in a room and burns the text afterwards', async ({ page }) => {
    await register(page, uniqueEmail(), `${pseudonym}a`);
    await page.getByRole('button', { name: 'Später' }).click();
    await page.goto('/rooms/nachts', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Beitreten' }).click();
    await page.getByRole('button', { name: 'Verlassen' }).waitFor();
    await page.getByTestId('write-button').filter({ visible: true }).first().click();
    await page.locator('.tiptap').waitFor();
    await page.locator('.tiptap').fill(nightText);
    await page.getByRole('button', { name: 'Fertig' }).click();
    await page.getByRole('button', { name: 'Anonym teilen' }).first().click();
    await page.getByRole('button', { name: 'Nachts' }).click();
    await page.getByRole('button', { name: 'Anonym teilen' }).last().click();
    await expect(page).toHaveURL(/\/rooms\/nachts/);
    await expect(page.getByText(`Heute Nacht ${stamp}`).first()).toBeVisible();
    await expect(page.getByText('anonym').first()).toBeVisible();

    await page.goto('/journal', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Verbrennen' }).first().click();
    await expect(page.getByText('Dieser Text wird überall endgültig gelöscht.')).toBeVisible();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page.getByText(`Heute Nacht ${stamp}`)).toHaveCount(0);
  });

  test('exports the journal as a ZIP', async ({ page }) => {
    await register(page, uniqueEmail(), `${pseudonym}x`);
    await page.getByRole('button', { name: 'Später' }).click();
    await page.goto('/journal', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Als ZIP exportieren' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Herunterladen' }).click({ timeout: 120_000 });
    expect((await download).suggestedFilename()).toBe('inkwell-export.zip');
  });

  test('writes from the prompt of the day', async ({ page }) => {
    await register(page, uniqueEmail(), `${pseudonym}i`);
    await page.getByRole('button', { name: 'Später' }).click();
    await expect(page).toHaveURL(/\/today/);
    const promptLine = page.locator('section[aria-labelledby="prompt"] p').first();
    // The prompt follows the reader's local day, so it appears once the page has hydrated.
    await expect(promptLine).not.toBeEmpty();
    const prompt = (await promptLine.textContent())?.trim() ?? '';
    expect(prompt.length).toBeGreaterThan(10);
    await page.getByRole('link', { name: 'Damit anfangen' }).click();
    await expect(page).toHaveURL(/\/write\?prompt=\d+/);
    await expect(page.getByText(prompt)).toBeVisible();
    await page.locator('.tiptap').fill(`Eine Antwort auf den Impuls ${stamp}.`);
    await page.getByRole('button', { name: 'Fertig' }).click();
    await page.getByRole('button', { name: 'Im Heft ablegen' }).click();
    await expect(page).toHaveURL(/\/journal/);
    await expect(page.getByText(`Eine Antwort auf den Impuls ${stamp}.`).first()).toBeVisible();
  });

  test('writes straight into a room, and a reader keeps the text', async ({ page, browser }) => {
    // Two sign-ups and a full reading session: give it the slow-test budget.
    test.slow();
    const keptText = `Der erste warme Kaffee ${stamp} nach einer langen Nacht.`;
    await register(page, uniqueEmail(), `${pseudonym}w`);
    await page.getByRole('button', { name: 'Später' }).click();
    await page.goto('/rooms/dankbar', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Beitreten' }).click();
    await page.getByRole('link', { name: 'Hier schreiben' }).first().click();
    await expect(page).toHaveURL(/\/write\?room=dankbar/);
    await page.locator('.tiptap').fill(keptText);
    await page.getByRole('button', { name: 'Fertig' }).click();
    await page.getByRole('button', { name: 'Anonym teilen' }).first().click();
    await expect(page.getByRole('button', { name: 'Dankbar', pressed: true })).toBeVisible();
    await page.getByRole('button', { name: 'Anonym teilen' }).last().click();
    await expect(page).toHaveURL(/\/rooms\/dankbar/);

    const readerContext = await browser.newContext();
    const reader = await readerContext.newPage();
    await register(reader, uniqueEmail().replace('e2e-', 'e2e-r-'), `${pseudonym}r`);
    await reader.getByRole('button', { name: 'Später' }).click();
    await reader.goto('/rooms/dankbar', { waitUntil: 'networkidle' });
    await reader.getByText(keptText).first().click();
    await expect(reader).toHaveURL(/\/posts\//);
    await reader.getByRole('button', { name: 'Merken' }).click();
    await expect(reader.getByRole('button', { name: 'Gemerkt' })).toBeVisible();
    const postUrl = reader.url();

    // Reading display changes at once.
    await reader.getByRole('button', { name: 'Darstellung' }).click();
    await reader.getByRole('button', { name: 'Grösser' }).click();
    const body = reader.locator('[id^="reading-body-"]');
    await expect(body).toHaveCSS('font-size', '20px');
    await reader.keyboard.press('Escape');

    // Keep a line: select the words "warme Kaffee" in the text.
    await body.evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const node = walker.nextNode();
      if (!node) return;
      const start = (node.textContent ?? '').indexOf('warme Kaffee');
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + 'warme Kaffee'.length);
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await reader.getByRole('button', { name: 'Zeile behalten' }).click();
    await reader.goto('/journal?view=lines', { waitUntil: 'networkidle' });
    await expect(reader.getByText('warme Kaffee', { exact: true })).toBeVisible();

    await reader.goto('/journal?view=kept', { waitUntil: 'networkidle' });
    await expect(reader.getByText(keptText).first()).toBeVisible();

    // Write about it, privately.
    await reader.goto(postUrl, { waitUntil: 'networkidle' });
    await reader.getByRole('link', { name: /Dazu in dein Heft schreiben/ }).click();
    await expect(reader).toHaveURL(/\/write\?about=/);
    await expect(reader.getByText('Zu einem Text aus Dankbar')).toBeVisible();
    await readerContext.close();
  });

  test('keeps an unfinished text as a draft and picks it up again', async ({ page }) => {
    const draftText = `Ein angefangener Gedanke ${stamp}, noch ohne Ende`;
    await register(page, uniqueEmail(), `${pseudonym}d`);
    await page.locator('.tiptap').fill(draftText);
    // Autosave runs every two seconds.
    await page.waitForTimeout(2600);
    await page.getByRole('button', { name: 'Später' }).click();
    await page.getByRole('button', { name: 'Behalten' }).click();
    await expect(page).toHaveURL(/\/today/);
    await page.goto('/journal?view=drafts', { waitUntil: 'networkidle' });
    await page
      .getByRole('link', { name: new RegExp(draftText) })
      .first()
      .click();
    await expect(page).toHaveURL(/\/write\?draft=/);
    await expect(page.locator('.tiptap')).toContainText(draftText);
  });

  test('seals a letter to the later self', async ({ page }) => {
    const letterText = `Liebes späteres Ich ${stamp}, wie geht es dir inzwischen?`;
    await register(page, uniqueEmail(), `${pseudonym}l`);
    await page.getByRole('button', { name: 'Schreibzeit' }).click();
    await page.getByRole('button', { name: '5 Min.', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Schreibzeit beenden' })).toContainText(
      /\d:\d\d/,
    );
    await page.locator('.tiptap').fill(letterText);
    await page.getByRole('button', { name: 'Fertig' }).click();
    await page.getByRole('button', { name: '3 Monate' }).click();
    await page.getByRole('button', { name: 'Versiegeln' }).click();
    await expect(page).toHaveURL(/\/journal/);
    await expect(page.getByText(/Versiegelt bis/).first()).toBeVisible();
    await expect(page.getByText(letterText)).toHaveCount(0);
  });
});
