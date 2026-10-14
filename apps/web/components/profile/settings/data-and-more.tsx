'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { HELPLINES, REGIONS, type Locale, type Me } from '@inkwell/shared';

import { ExportButton } from '@/components/journal/export-button';
import { useAnnouncer } from '@/components/providers/announcer';
import { Button } from '@/components/ui/button';
import { Confirm } from '@/components/ui/confirm';
import { useErrorMessage } from '@/components/ui/error-text';
import { Icon } from '@/components/ui/icon';
import { publicEnv } from '@/env';
import { signOut } from '@/features/auth/actions';
import { revokeDeletion, scheduleDeletion, unblock } from '@/features/posts/actions';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { site } from '@/lib/site';

import type { BlockedEntry } from '@/features/posts/queries';

export function BlockedSettings({ blocks }: { blocks: BlockedEntry[] }) {
  const t = useTranslations('settings.blocked');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <p className="text-[13px] text-ink-secondary">{t('hint')}</p>
      {blocks.length === 0 ? <p className="mt-4 text-ink-secondary">{t('empty')}</p> : null}
      <ul className="mt-3 divide-y divide-line">
        {blocks.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between py-3">
            <span>
              {entry.pseudonym.startsWith('new.') ? t('anonymousEntry') : entry.pseudonym}
            </span>
            <Button
              variant="ghost"
              size="sm"
              busy={pending}
              onClick={() =>
                startTransition(async () => {
                  await unblock(entry.id);
                  router.refresh();
                })
              }
            >
              {t('unblock')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DataSettings({ me }: { me: Me }) {
  const t = useTranslations('settings.data');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await scheduleDeletion();
      setConfirming(false);
      if (!result.ok) return announce(message(result.error) ?? '');
      announce(t('deleteScheduled', { date: formatDate(result.data.scheduledFor, locale) }));
      await signOut();
      router.replace('/');
    });
  };

  const revoke = () => {
    startTransition(async () => {
      const result = await revokeDeletion();
      if (!result.ok) return announce(message(result.error) ?? '');
      announce(t('revoked'));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h3 className="font-medium">{t('export')}</h3>
        <div className="mt-2">
          <ExportButton />
        </div>
      </section>
      <section>
        <h3 className="font-medium text-warn">{t('delete')}</h3>
        <p className="mt-1 text-[13px] text-ink-secondary">{t('deleteExplain')}</p>
        {me.deletionScheduledAt ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm">
              {t('deleteScheduled', { date: formatDate(me.deletionScheduledAt, locale) })}
            </p>
            <Button variant="secondary" size="sm" className="w-fit" onClick={revoke} busy={pending}>
              {t('revoke')}
            </Button>
          </div>
        ) : (
          <>
            <label className="mt-3 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 accent-accent"
              />
              <span>{t('deleteConfirmLabel')}</span>
            </label>
            <Button
              variant="danger"
              size="sm"
              className="mt-3"
              disabled={!acknowledged}
              onClick={() => setConfirming(true)}
            >
              {t('deleteStep1')}
            </Button>
          </>
        )}
      </section>
      <Confirm
        open={confirming}
        title={t('delete')}
        body={t('deleteExplain')}
        confirmLabel={t('deleteConfirm')}
        cancelLabel={common('cancel')}
        closeLabel={common('close')}
        danger
        busy={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

export function AboutSettings() {
  const t = useTranslations('settings.about');
  const [standalone, setStandalone] = useState(false);
  useEffect(() => setStandalone(window.matchMedia('(display-mode: standalone)').matches), []);
  const links: { href: '/changelog' | '/privacy' | '/terms' | '/imprint'; label: string }[] = [
    { href: '/changelog', label: t('changelog') },
    { href: '/privacy', label: t('privacy') },
    { href: '/terms', label: t('terms') },
    { href: '/imprint', label: t('imprint') },
  ];
  return (
    <div className="flex flex-col gap-8">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-ink-secondary">{t('version')}</dt>
        <dd>
          {publicEnv.appVersion}
          {standalone ? ' · PWA' : ''}
        </dd>
        <dt className="text-ink-secondary">{t('build')}</dt>
        <dd>
          <code>{publicEnv.buildId}</code>
        </dd>
      </dl>
      <ul className="divide-y divide-line">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex min-h-11 items-center justify-between">
              {link.label}
              <Icon name="arrow-right" size={16} className="text-ink-tertiary" />
            </Link>
          </li>
        ))}
        <li>
          <a
            href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(`Inkwell ${publicEnv.appVersion} (${publicEnv.buildId})`)}`}
            className="flex min-h-11 items-center justify-between"
          >
            {t('report')}
            <Icon name="arrow-right" size={16} className="text-ink-tertiary" />
          </a>
        </li>
      </ul>
      <section>
        <h3 className="font-medium">{t('help')}</h3>
        <p className="text-[13px] text-ink-secondary">{t('helpIntro')}</p>
        <dl className="mt-3 grid gap-3">
          {REGIONS.map((region) => (
            <div key={region}>
              <dt className="text-[13px] text-ink-tertiary">{region}</dt>
              <dd className="flex flex-wrap gap-x-4 text-sm">
                {HELPLINES[region].map((line) => (
                  <a
                    key={line.number}
                    href={`tel:${line.number}`}
                    className="inline-flex items-center gap-1 hover:text-accent-text"
                  >
                    <Icon name="phone" size={14} />
                    {line.name} {line.display}
                  </a>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
