import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

import { LanguageSwitcher } from './language-switcher';
import { Wordmark } from './wordmark';

export function MarketingFooter() {
  const t = useTranslations('marketing.footer');
  const links: { href: string; label: string }[] = [
    { href: '/imprint', label: t('imprint') },
    { href: '/privacy', label: t('privacy') },
    { href: '/terms', label: t('terms') },
    { href: '/status', label: t('status') },
    { href: '/changelog', label: t('changelog') },
    { href: '/press', label: t('press') },
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <Wordmark compact />
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-secondary"
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
    </footer>
  );
}
