'use client';

import { downloadZip } from 'client-zip';

import { db } from '@/lib/db';

/**
 * Client half of the export: the server archive (shared texts, profile,
 * reactions, comments) is streamed through, private entries are decrypted here
 * and written into the same ZIP. Nothing private is ever uploaded.
 */
export async function buildExportDownload(serverArchiveUrl: string): Promise<Blob> {
  const response = await fetch(serverArchiveUrl, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('EXPORT_NOT_READY');
  const serverZip = await response.blob();

  const entries = await db().entries.where('visibility').equals('private').toArray();
  const files = entries
    .filter((entry) => entry.body !== null && !entry.locked)
    .map((entry) => {
      const date = entry.createdAt.slice(0, 10);
      const year = entry.createdAt.slice(0, 4);
      const slug =
        (entry.title ?? entry.id)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || entry.id;
      const frontMatter = [
        '---',
        `id: ${entry.id}`,
        `type: ${entry.type}`,
        'visibility: private',
        `created: ${entry.createdAt}`,
        entry.title ? `title: "${entry.title.replace(/"/g, '\\"')}"` : null,
        '---',
        '',
      ]
        .filter((line): line is string => line !== null)
        .join('\n');
      return {
        name: `${year}/${date}-${slug}.md`,
        lastModified: new Date(entry.updatedAt),
        input: `${frontMatter}${entry.body ?? ''}\n`,
      };
    });

  return downloadZip([{ name: 'shared-and-profile.zip', input: serverZip }, ...files]).blob();
}
