'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { firstLine, type JournalPost, type Locale } from '@inkwell/shared';

import { useCryptoState } from '@/components/providers/crypto-provider';
import { Icon } from '@/components/ui/icon';
import { cryptoClient } from '@/features/crypto/client';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

const VISIBILITY_ICON = { private: 'lock', anonymous: 'mask', public: 'globe' } as const;

/** The last own entry; private ones are decrypted in the browser before the first line is shown. */
export function LastEntry({ entry }: { entry: JournalPost }) {
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const crypto = useCryptoState();
  const [line, setLine] = useState<string | null>(entry.body ? firstLine(entry.body) : null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (entry.visibility !== 'private' || !entry.ciphertext || !entry.nonce || !entry.wrappedKey)
      return;
    if (crypto.hasKey === null) return;
    if (!crypto.hasKey) {
      setLocked(true);
      return;
    }
    void cryptoClient
      .decrypt({ ciphertext: entry.ciphertext, nonce: entry.nonce, wrappedKey: entry.wrappedKey })
      .then((plain) => setLine(firstLine(plain)))
      .catch(() => setLocked(true));
  }, [entry, crypto.hasKey]);

  const href = entry.visibility === 'private' ? `/journal?open=${entry.id}` : `/posts/${entry.id}`;

  return (
    <Link
      href={href}
      data-list-item
      className="card block p-5 outline-none focus-visible:shadow-[var(--focus-ring)]"
    >
      <p className="flex items-center gap-2 text-[13px] text-ink-secondary">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-paper-sunken px-2 font-medium">
          <Icon name={VISIBILITY_ICON[entry.visibility]} size={13} />
          {common(`visibility.${entry.visibility}`)}
        </span>
        <time dateTime={entry.createdAt}>{formatDate(entry.createdAt, locale)}</time>
      </p>
      <p
        className={
          locked
            ? 'mt-3 text-[0.9375rem] text-ink-secondary'
            : 'prose-reading mt-3 line-clamp-3 text-[1.125rem]'
        }
        style={{ viewTransitionName: `post-line-${entry.id}` }}
      >
        {entry.title ?? line ?? (locked ? auth('unlock.locked') : '…')}
      </p>
    </Link>
  );
}
