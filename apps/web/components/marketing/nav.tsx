'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { LanguageSwitcher } from './language-switcher';
import { Wordmark } from './wordmark';

/** Sticky, 56 px; turns translucent with blur once the page scrolls, and the wordmark shrinks slightly. */
export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 border-b transition-colors',
        scrolled ? 'border-line bg-paper/80 backdrop-blur-md' : 'border-transparent bg-paper',
      )}
      style={{ transitionDuration: 'var(--motion-base)' }}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-paper focus:px-3 focus:py-2"
      >
        {t('nav.skipToContent')}
      </a>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center">
          <Wordmark compact={scrolled} className="transition-[font-size]" />
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm text-ink-secondary md:flex"
          aria-label="Sections"
        >
          <a href="#how" className="hover:text-ink">
            {t('nav.how')}
          </a>
          <a href="#trust" className="hover:text-ink">
            {t('nav.trust')}
          </a>
          <a href="#faq" className="hover:text-ink">
            {t('nav.faq')}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex">
            <LanguageSwitcher compact />
          </span>
          {signedIn ? (
            <Link
              href="/today"
              className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-ink"
            >
              {t('nav.today')}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-9 items-center rounded-md border border-line-strong px-3.5 text-sm font-medium"
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/sign-in?intent=create"
                className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-accent-ink"
              >
                {t('common.createAccount')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
