'use client';

import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { NAV_ITEMS } from './nav-items';
import { WriteButton } from './write-button';

interface AppNavProps {
  signedIn: boolean;
  variant: 'tabbar' | 'sidebar';
}

function useActiveKey(): string | null {
  const pathname = usePathname();
  const active = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return active?.key ?? null;
}

/**
 * Bottom tab bar under 768 px, sidebar above. Rendered once in the shell; the
 * active state follows the URL, so it never re-mounts on navigation.
 */
export function AppNav({ signedIn, variant }: AppNavProps) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
  const activeKey = useActiveKey();
  const items = NAV_ITEMS.filter((item) => signedIn || item.guest);
  const activeOrder = NAV_ITEMS.find((item) => item.key === activeKey)?.order ?? 0;

  const setDirection = (targetOrder: number) => {
    if (window.matchMedia('(min-width: 768px)').matches) return;
    document.documentElement.setAttribute(
      'data-tab-direction',
      targetOrder > activeOrder ? 'forward' : 'back',
    );
    window.setTimeout(() => document.documentElement.removeAttribute('data-tab-direction'), 600);
  };

  if (variant === 'tabbar') {
    return (
      <nav
        aria-label={t('menu')}
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden"
      >
        <ul className="flex h-16 items-stretch px-1">
          {items.slice(0, 2).map((item) => (
            <TabItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={t(item.key)}
              active={activeKey === item.key}
              onNavigate={() => setDirection(item.order)}
            />
          ))}
          <li className="flex flex-1 items-center justify-center">
            <WriteButton compact label={t('write')} signedIn={signedIn} />
          </li>
          {signedIn ? (
            items
              .slice(2)
              .map((item) => (
                <TabItem
                  key={item.key}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.key)}
                  active={activeKey === item.key}
                  onNavigate={() => setDirection(item.order)}
                />
              ))
          ) : (
            <TabItem
              href="/sign-in"
              icon="me"
              label={common('signIn')}
              active={false}
              onNavigate={() => undefined}
            />
          )}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t('menu')}
      className="sticky top-0 hidden h-dvh w-[var(--width-sidebar)] shrink-0 flex-col px-4 pt-6 pb-5 md:flex"
    >
      <Link
        href={signedIn ? '/today' : '/'}
        className="mb-7 inline-flex h-8 items-center self-start rounded-sm px-2 font-serif text-[1.375rem] leading-none tracking-[-0.02em]"
      >
        inkwell<span className="text-accent">.</span>
      </Link>
      <WriteButton label={t('write')} signedIn={signedIn} />
      <ul className="mt-7 flex flex-col gap-0.5">
        {items.map((item) => {
          const active = activeKey === item.key;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2.5 rounded-md border px-2.5 text-[0.9375rem] state-toggle',
                  active
                    ? 'border-line bg-surface font-medium text-ink'
                    : 'border-transparent text-ink-secondary hover:bg-paper-raised hover:text-ink',
                )}
              >
                <Icon name={item.icon} size={18} className={active ? 'text-accent' : undefined} />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
        {!signedIn ? (
          <li>
            <Link
              href="/sign-in"
              className="flex h-9 items-center gap-2.5 rounded-md border border-transparent px-2.5 text-[0.9375rem] text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink"
            >
              <Icon name="me" size={18} />
              {common('signIn')}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function TabItem({
  href,
  icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li className="flex flex-1">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium state-toggle',
          active ? 'text-ink' : 'text-ink-tertiary',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-12 items-center justify-center rounded-full state-toggle',
            active && 'bg-accent-soft text-accent-text',
          )}
        >
          <Icon name={icon} size={20} />
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
