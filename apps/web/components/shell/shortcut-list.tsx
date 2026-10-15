import { getTranslations } from 'next-intl/server';

/** The desktop keyboard shortcuts, quietly listed where there is room for them. */
export async function ShortcutList() {
  const t = await getTranslations('today.shortcuts');
  const rows: { keys: string[]; label: string }[] = [
    { keys: ['N'], label: t('write') },
    { keys: ['/'], label: t('search') },
    { keys: ['J', 'K'], label: t('move') },
    { keys: ['Esc'], label: t('close') },
  ];
  return (
    <section aria-labelledby="shortcuts" className="mt-8">
      <h2 id="shortcuts" className="label mb-3">
        {t('title')}
      </h2>
      <dl className="flex flex-col gap-2 text-[13px] text-ink-secondary">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt>{row.label}</dt>
            <dd className="flex gap-1">
              {row.keys.map((key) => (
                <kbd
                  key={key}
                  className="kbd border border-line bg-surface font-sans text-ink-secondary"
                >
                  {key}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
