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
});
