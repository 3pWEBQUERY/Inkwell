import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { site } from '@/lib/site';

import { LanguageSwitcher } from './language-switcher';
import { CONTAINER } from './sections';
import { Wordmark } from './wordmark';

export function MarketingFooter() {
  const t = useTranslations('marketing.footer');
  const hero = useTranslations('marketing.hero');
  const links: { href: string; label: string }[] = [
    { href: '/imprint', label: t('imprint') },
    { href: '/privacy', label: t('privacy') },
    { href: '/terms', label: t('terms') },
    { href: '/status', label: t('status') },
    { href: '/changelog', label: t('changelog') },
    { href: '/press', label: t('press') },
  ];
  return (
    <footer className="border-t border-line bg-paper-sunken/60">
      <div className={cn(CONTAINER, 'flex flex-col gap-10 py-14 md:flex-row md:justify-between')}>
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-secondary">{hero('note')}</p>
        </div>
        <div className="flex flex-col gap-8 md:items-end">
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 gap-y-3 text-[0.9375rem] text-ink-secondary sm:grid-cols-4 md:flex md:flex-wrap md:justify-end md:gap-x-6"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
            <a href={`mailto:${site.contactEmail}`} className="hover:text-ink">
              {t('contact')}
            </a>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
