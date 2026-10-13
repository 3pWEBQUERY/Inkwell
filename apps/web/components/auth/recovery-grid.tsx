'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** The 12 words in a 3×4 grid with copy and download. */
export function RecoveryGrid({ mnemonic }: { mnemonic: string }) {
  const t = useTranslations('auth.recovery');
  const common = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const words = mnemonic.split(' ');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the download remains.
    }
  };

  const download = () => {
    const blob = new Blob(
      [t('fileHeader') + words.map((word, i) => `${i + 1}. ${word}`).join('\n') + '\n'],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = t('fileName');
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ol
        className="grid grid-cols-3 gap-2 rounded-md border border-line bg-paper-raised p-3 font-serif"
        aria-label={t('title')}
      >
        {words.map((word, index) => (
          <li key={`${word}-${index}`} className="flex items-baseline gap-2 px-2 py-1.5">
            <span className="w-5 text-right text-xs text-ink-tertiary">{index + 1}</span>
            <span className="text-lg">{word}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={copy}>
          <Icon name="copy" size={16} />
          {copied ? common('copied') : t('copy')}
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <Icon name="download" size={16} />
          {t('download')}
        </Button>
      </div>
    </div>
  );
}
