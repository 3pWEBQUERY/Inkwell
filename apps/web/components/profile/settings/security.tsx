'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { CodeInput } from '@/components/auth/code-input';
import { RecoveryGrid } from '@/components/auth/recovery-grid';
import { useAnnouncer } from '@/components/providers/announcer';
import { useCryptoState } from '@/components/providers/crypto-provider';
import { Button } from '@/components/ui/button';
import { ErrorText } from '@/components/ui/error-text';
import { reauthenticateRequest, reauthenticateVerify } from '@/features/auth/reauth-actions';
import { cryptoClient } from '@/features/crypto/client';
import { revokeSession } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

import type { Locale, Me, SessionView } from '@inkwell/shared';

/** Recovery code (after a fresh sign-in code) and the list of active sessions. */
export function SecuritySettings({ me, sessions }: { me: Me; sessions: SessionView[] }) {
  const t = useTranslations('settings.security');
  const auth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const crypto = useCryptoState();
  const { announce } = useAnnouncer();
  const [step, setStep] = useState<'idle' | 'code' | 'shown'>('idle');
  const [code, setCode] = useState('');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const request = () => {
    startTransition(async () => {
      setError(null);
      const result = await reauthenticateRequest(locale);
      if (!result.ok) return setError(result.error);
      setStep('code');
    });
  };

  const verify = () => {
    startTransition(async () => {
      const result = await reauthenticateVerify(code);
      if (!result.ok) return setError(result.error);
      try {
        setMnemonic(await cryptoClient.revealMnemonic());
        setStep('shown');
      } catch {
        setError('INTERNAL');
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="font-medium">{t('recovery')}</h3>
        {crypto.hasKey === false ? (
          <p className="mt-1 text-[13px] text-ink-secondary">{t('recoveryUnavailable')}</p>
        ) : (
          <p className="mt-1 text-[13px] text-ink-secondary">{t('recoveryExplain')}</p>
        )}
        {step === 'idle' && crypto.hasKey ? (
          <Button variant="secondary" size="sm" className="mt-3" onClick={request} busy={pending}>
            {t('showRecovery')}
          </Button>
        ) : null}
        {step === 'code' ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-ink-secondary">{auth('emailStep.sent')}</p>
            <CodeInput value={code} onChange={setCode} label={auth('emailStep.codeLabel')} />
            <Button
              size="sm"
              className="w-fit"
              onClick={verify}
              disabled={code.length !== 6}
              busy={pending}
            >
              {t('showRecovery')}
            </Button>
          </div>
        ) : null}
        {step === 'shown' && mnemonic ? (
          <div className="mt-3">
            <RecoveryGrid mnemonic={mnemonic} />
          </div>
        ) : null}
        <ErrorText code={error} />
      </section>

      <section>
        <h3 className="font-medium">{t('sessions')}</h3>
        <ul className="mt-2 divide-y divide-line">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-3 py-3">
              <span className="flex-1">
                <span className="block">
                  {session.device}
                  {session.current ? ` · ${t('current')}` : ''}
                </span>
                <span className="text-[13px] text-ink-tertiary">
                  {t('lastSeen', {
                    date: formatDate(session.lastSeenAt, locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </span>
              </span>
              {!session.current ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await revokeSession(session.id);
                      announce(t('signedOutSession'));
                      router.refresh();
                    })
                  }
                >
                  {t('signOutSession')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        <span className="sr-only">{me.email}</span>
      </section>
    </div>
  );
}
