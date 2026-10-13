import type { Page } from '@playwright/test';

/**
 * In the e2e environment the API runs with MAIL_TRANSPORT=console and
 * E2E_MAILBOX_URL points at a tiny route that returns the last code sent to an
 * address (see apps/api test helpers). Locally, pass the code by hand.
 */
export async function lastCodeFor(email: string): Promise<string> {
  const mailbox = process.env.E2E_MAILBOX_URL;
  if (!mailbox) throw new Error('E2E_MAILBOX_URL is required to read sign-in codes');
  const response = await fetch(`${mailbox}?to=${encodeURIComponent(email)}`);
  const { code } = (await response.json()) as { code: string };
  return code;
}

export function uniqueEmail(): string {
  return `e2e-${Date.now().toString(36)}@example.ch`;
}

export async function register(page: Page, email: string, pseudonym: string): Promise<void> {
  await page.goto('/sign-in?intent=create', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Mit E-Mail fortfahren' }).click();
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  await page.getByLabel('Sechsstelliger Code 1').waitFor();
  const code = await lastCodeFor(email);
  for (const [index, digit] of code.split('').entries()) {
    await page.getByLabel(`Sechsstelliger Code ${index + 1}`).fill(digit);
  }
  await page.getByRole('button', { name: 'Ja' }).click();
  await page.getByLabel('Pseudonym').fill(pseudonym);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel(/Ich verstehe/).check();
  await page.getByRole('button', { name: 'Ich habe ihn gesichert' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.waitForURL(/\/write/);
  await page.getByRole('button', { name: 'Fertig' }).waitFor();
}
