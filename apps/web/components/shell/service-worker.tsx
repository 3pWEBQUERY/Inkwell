'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Registers the service worker and shows a quiet "new version" bar. The reload
 * happens only on click (PRD 12.1), never on its own.
 */
export function ServiceWorkerRegistration() {
  const t = useTranslations('pwa');
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller)
              setWaiting(installing);
          });
        });
      })
      .catch(() => undefined);
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(var(--height-tabbar)+12px)] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl float px-4 py-3 md:bottom-6"
    >
      <span className="text-sm">{t('update')}</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}
      >
        {t('reload')}
      </Button>
    </div>
  );
}
