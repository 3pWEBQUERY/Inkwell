'use client';

import { useTranslations } from 'next-intl';

import { isErrorCode } from '@inkwell/shared';

/** Maps a server error code to a localised sentence; unknown codes fall back to the generic one. */
export function useErrorMessage(): (code: string | null | undefined) => string | null {
  const t = useTranslations('errors');
  return (code) => {
    if (!code) return null;
    if (isErrorCode(code)) return t(`codes.${code}`);
    return t('generic');
  };
}

export function ErrorText({ code }: { code: string | null | undefined }) {
  const message = useErrorMessage()(code);
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-warn">
      {message}
    </p>
  );
}
