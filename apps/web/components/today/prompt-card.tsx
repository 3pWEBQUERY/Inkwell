'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { PROMPT_COUNT, promptIndexOfDay, promptText, type Locale } from '@inkwell/shared';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';

/**
 * An optional way in. Everyone writing in a language sees the same prompt
 * today; "another prompt" only changes it in this browser. Nothing is tracked.
 */
export function PromptCard() {
  const t = useTranslations('today.prompt');
  const locale = useLocale() as Locale;
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => setIndex(promptIndexOfDay(new Date())), []);

  return (
    <section aria-labelledby="prompt" className="card overflow-hidden">
      <div className="flex items-start gap-4 p-5 md:p-6">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-tint text-accent-text"
        >
          <Icon name="compass" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="prompt" className="label">
            {t('label')}
          </h2>
          <p className="mt-1.5 min-h-[3.25rem] font-serif text-[1.25rem] leading-snug text-pretty">
            {index === null ? '' : promptText(locale, index)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper-sunken/50 px-5 py-3 md:px-6">
        <Link
          href={index === null ? '/write' : `/write?prompt=${String(index)}`}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3.5 text-[0.875rem] font-medium text-accent-ink state-toggle hover:bg-accent-hover"
        >
          <Icon name="pen" size={15} />
          {t('start')}
        </Link>
        <button
          type="button"
          onClick={() => setIndex((current) => ((current ?? 0) + 1) % PROMPT_COUNT)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[0.875rem] font-medium text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink"
        >
          {t('other')}
        </button>
      </div>
    </section>
  );
}
