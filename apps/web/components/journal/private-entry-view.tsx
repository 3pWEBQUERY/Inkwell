'use client';

import { useTranslations } from 'next-intl';

import { renderMarkdown } from '@inkwell/shared';

import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

import type { EntryRecord } from '@/lib/db';

/** A private entry, decrypted locally, read in the same typography as everything else. */
export function PrivateEntryView({
  entry,
  onClosed,
}: {
  entry: EntryRecord;
  onClosed: () => void;
}) {
  const t = useTranslations('reading');
  const auth = useTranslations('auth');
  const me = useMe();
  if (entry.locked || entry.body === null)
    return <p className="text-ink-secondary">{auth('unlock.locked')}</p>;
  return (
    <div>
      <div
        className={`prose-reading ${me?.settings.editorFont === 'sans' ? 'sans' : ''}`}
        style={{ fontSize: `${me?.settings.fontSize ?? 19}px` }}
        // The renderer escapes everything; only p, br, strong, em, blockquote and hr are emitted.
        dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.body) }}
      />
      <div className="mt-6">
        <Link href={`/write?editPrivate=${entry.id}`} onClick={onClosed}>
          <Button variant="secondary" size="sm">
            {t('edit')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
