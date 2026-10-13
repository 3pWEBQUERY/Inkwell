'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISITS_KEY = 'inkwell.visits';
const LAST_VISIT_KEY = 'inkwell.visits.last';
const DISMISSED_KEY = 'inkwell.install.dismissed';
const SHARED_KEY = 'inkwell.shared-once';

/**
 * One quiet hint after the third visit or the first shared text. Declined once,
 * it never returns. Platform-specific instructions, nothing else.
 */
export function InstallHint() {
  const t = useTranslations('pwa');
  const [visible, setVisible] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      // A visit is one calendar day, not one page load.
      const today = new Date().toISOString().slice(0, 10);
      let visits = Number.parseInt(localStorage.getItem(VISITS_KEY) ?? '0', 10);
      if (localStorage.getItem(LAST_VISIT_KEY) !== today) {
        visits += 1;
        localStorage.setItem(VISITS_KEY, String(visits));
        localStorage.setItem(LAST_VISIT_KEY, today);
      }
      const sharedOnce = localStorage.getItem(SHARED_KEY) === '1';
      const ua = navigator.userAgent;
      setPlatform(
        /iPhone|iPad|iPod/.test(ua) ? 'ios' : ua.includes('Android') ? 'android' : 'desktop',
      );
      if (visits >= 3 || sharedOnce) setVisible(true);
    } catch {
      // No storage, no hint.
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      dismiss();
      return;
    }
    setShowHow(true);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(var(--height-tabbar)+12px)] z-40 mx-auto max-w-md rounded-md border border-line bg-paper-raised px-4 py-3 md:bottom-6"
    >
      <p className="text-sm">{showHow ? t(platform) : t('hint')}</p>
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t('notNow')}
        </Button>
        {!showHow ? (
          <Button size="sm" variant="secondary" onClick={install}>
            {deferred ? t('install') : t('show')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
