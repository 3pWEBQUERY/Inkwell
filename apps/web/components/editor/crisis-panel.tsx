'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { helplinesFor, regionFromLanguageTag, type Helpline } from '@inkwell/shared';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** Calm, non-blocking. Shown at most once per text, before the completion panel. */
export function CrisisPanel({ onContinue }: { onContinue: () => void }) {
  const t = useTranslations('crisis');
  const [line, setLine] = useState<Helpline | null>(null);

  useEffect(() => {
    setLine(helplinesFor(regionFromLanguageTag(navigator.language))[0] ?? null);
  }, []);

  if (!line) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      className="float mx-auto w-full max-w-[520px] rounded-xl p-6"
    >
      <p className="font-serif text-xl text-balance">{t('title')}</p>
      <p className="mt-3 text-ink-secondary">
        {t('body', { name: line.name, number: line.display })}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`tel:${line.number}`}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 font-medium text-accent-ink state-toggle hover:bg-accent-hover"
        >
          <Icon name="phone" size={18} />
          {t('call')}
        </a>
        <Button variant="secondary" onClick={onContinue}>
          {t('continue')}
        </Button>
      </div>
      <p className="mt-4 text-[13px] text-ink-tertiary">{t('local')}</p>
    </div>
  );
}
