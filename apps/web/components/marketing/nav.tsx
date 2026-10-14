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
        'sticky top-0 z-30 h-[var(--height-nav)] border-b transition-colors',
        scrolled ? 'border-line bg-paper/85 backdrop-blur-md' : 'border-transparent bg-paper',
      )}
      style={{ transitionDuration: 'var(--motion-base)' }}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-paper focus:px-3 focus:py-2"
      >
        {t('nav.skipToContent')}
      </a>
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex items-center">
          <Wordmark compact={scrolled} className="transition-[font-size]" />
        </Link>
        <nav
          className="hidden items-center gap-1 text-[0.9375rem] text-ink-secondary md:flex"
          aria-label="Sections"
        >
          <a
            href="#how"
            className="rounded-md px-3 py-1.5 state-toggle hover:bg-paper-raised hover:text-ink"
          >
            {t('nav.how')}
          </a>
          <a
            href="#trust"
            className="rounded-md px-3 py-1.5 state-toggle hover:bg-paper-raised hover:text-ink"
          >
            {t('nav.trust')}
          </a>
          <a
            href="#faq"
            className="rounded-md px-3 py-1.5 state-toggle hover:bg-paper-raised hover:text-ink"
          >
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
              className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-[0.875rem] font-medium text-accent-ink state-toggle hover:bg-accent-hover"
            >
              {t('nav.today')}
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden h-9 items-center rounded-md px-3.5 text-[0.875rem] font-medium state-toggle hover:bg-paper-raised sm:inline-flex"
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/sign-in?intent=create"
                className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-[0.875rem] font-medium text-accent-ink state-toggle hover:bg-accent-hover"
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
