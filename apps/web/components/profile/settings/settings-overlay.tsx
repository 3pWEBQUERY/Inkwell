'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { Overlay } from '@/components/ui/overlay';
import { canGoBackInApp } from '@/features/navigation/close-overlay';

/** On phones a settings group opens as a sheet over /me; on wider screens the full page is used instead. */
export function SettingsOverlay({ children, title }: { children: ReactNode; title: string }) {
  const router = useRouter();
  const common = useTranslations('common');
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setMobile(!window.matchMedia('(min-width: 768px)').matches);
  }, []);

  useEffect(() => {
    if (mobile === false) router.refresh();
  }, [mobile, router]);

  if (mobile !== true) return null;

  return (
    <Overlay
      open
      onClose={() => (canGoBackInApp() ? router.back() : router.replace('/me'))}
      kind="sheet"
      title={title}
      closeLabel={common('close')}
    >
      {children}
    </Overlay>
  );
}
