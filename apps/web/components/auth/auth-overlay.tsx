'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Overlay } from '@/components/ui/overlay';
import { canGoBackInApp } from '@/features/navigation/close-overlay';

import { AuthPanel } from './auth-panel';

/** The panel as an intercepting overlay: the page behind stays, the URL still changes. */
export function AuthOverlay({
  intent,
  appleClientId,
}: {
  intent: 'create' | 'sign-in';
  appleClientId?: string | undefined;
}) {
  const router = useRouter();
  const common = useTranslations('common');
  const [open, setOpen] = useState(true);
  return (
    <Overlay
      open={open}
      onClose={() => (canGoBackInApp() ? router.back() : router.replace('/'))}
      closeLabel={common('close')}
      width={488}
      hideClose
    >
      <AuthPanel
        initialIntent={intent}
        appleClientId={appleClientId}
        onFinished={() => {
          setOpen(false);
          router.replace('/today');
        }}
      />
    </Overlay>
  );
}
