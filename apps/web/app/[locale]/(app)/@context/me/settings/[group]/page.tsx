import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { SETTINGS_GROUPS } from '../../../../me/settings/[group]/settings-group';

/** Wide screens: the list of groups in the context column next to the open group. */
export default async function SettingsContext({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  const t = await getTranslations('settings');
  return (
    <nav aria-label={t('title')}>
      <ul className="flex flex-col gap-1">
        {SETTINGS_GROUPS.map((candidate) => (
          <li key={candidate}>
            <Link
              href={`/me/settings/${candidate}`}
              aria-current={candidate === group ? 'page' : undefined}
              className={cn(
                'block rounded-md px-3 py-2 text-sm state-toggle',
                candidate === group
                  ? 'bg-accent-soft text-ink'
                  : 'text-ink-secondary hover:text-ink',
              )}
            >
              {t(`groups.${candidate}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
