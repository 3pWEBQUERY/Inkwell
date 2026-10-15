'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Part = 'night' | 'morning' | 'day' | 'evening';

function partOfDay(hour: number): Part {
  if (hour < 5) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 18) return 'day';
  return 'evening';
}

/** A quiet line above the date, in the reader's local time. Rendered after hydration only. */
export function Greeting() {
  const t = useTranslations('today.greeting');
  const [part, setPart] = useState<Part | null>(null);
  useEffect(() => setPart(partOfDay(new Date().getHours())), []);
  return (
    <p className="label mb-2 h-5" aria-hidden={part === null}>
      {part ? t(part) : null}
    </p>
  );
}
