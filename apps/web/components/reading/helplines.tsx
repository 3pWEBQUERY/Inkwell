'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { helplinesFor, regionFromLanguageTag, type Helpline } from '@inkwell/shared';

import { Icon } from '@/components/ui/icon';

/** The country's helplines, chosen from the device language and region, never from location. */
export function Helplines() {
  const t = useTranslations('reading');
  const [lines, setLines] = useState<readonly Helpline[]>([]);

  useEffect(() => {
    setLines(helplinesFor(regionFromLanguageTag(navigator.language)));
  }, []);

  if (lines.length === 0) return null;

  return (
    <aside className="mt-12 rounded-lg bg-paper-sunken p-5 text-[13px] text-ink-secondary">
      <p>{t('helplinesIntro')}</p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {lines.map((line) => (
          <li key={line.number}>
            <a
              href={`tel:${line.number}`}
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <Icon name="phone" size={14} />
              {line.name} {line.display}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
