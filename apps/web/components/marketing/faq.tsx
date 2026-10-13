import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

interface FaqItem {
  q: string;
  a: string;
}

/** Native disclosure elements: keyboard accessible without any script. */
export function Faq() {
  const t = useTranslations('marketing.faq');
  const items = t.raw('items') as FaqItem[];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="font-serif text-3xl">{t('title')}</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 font-medium [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <Icon
                name="chevron-down"
                className="shrink-0 text-ink-secondary transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 max-w-prose text-ink-secondary">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
