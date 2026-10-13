import { useLocale, useTranslations } from 'next-intl';

import { formatDate } from '@/lib/format';

import type { LegalDocument } from '@/content/legal/types';
import type { Locale } from '@inkwell/shared';

/** Renders a legal document: one column, serif headings, lists where the content asks for them. */
export function LegalPage({ document }: { document: LegalDocument }) {
  const t = useTranslations('legal');
  const locale = useLocale() as Locale;
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">{document.title}</h1>
      <p className="mt-2 text-sm text-ink-tertiary">
        {t('updated', { date: formatDate(document.updated, locale) })}
      </p>
      {document.intro ? (
        <p className="mt-6 text-lg text-ink-secondary text-pretty">{document.intro}</p>
      ) : null}
      {document.sections.map((section) => {
        const listItems = section.paragraphs.filter((p) => p.startsWith('- '));
        const plain = section.paragraphs.filter((p) => !p.startsWith('- '));
        return (
          <section key={section.title} className="mt-10">
            <h2 className="font-serif text-2xl">{section.title}</h2>
            {plain.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-ink-secondary text-pretty">
                {paragraph}
              </p>
            ))}
            {listItems.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-secondary">
                {listItems.map((item) => (
                  <li key={item}>{item.slice(2)}</li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </article>
  );
}
