import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

import { CONTAINER } from './sections';

interface FaqItem {
  q: string;
  a: string;
}

/** Native disclosure elements: keyboard accessible without any script. */
export function Faq() {
  const t = useTranslations('marketing.faq');
  const items = t.raw('items') as FaqItem[];
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line">
      <div
        className={cn(
          CONTAINER,
          'grid gap-10 py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16 md:py-32',
        )}
      >
        <h2 className="display text-[2.25rem] md:sticky md:top-24 md:self-start md:text-[3rem]">
          {t('title')}
        </h2>
        <div className="card divide-y divide-line overflow-hidden">
          {items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium state-toggle hover:bg-paper-raised/60 md:px-6 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-sunken text-ink-secondary transition-transform group-open:rotate-45">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <p className="max-w-prose px-5 pb-5 leading-relaxed text-pretty text-ink-secondary md:px-6">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
