'use client';

import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import {
  LOCALES,
  PSEUDONYM_PATTERN,
  suggestPseudonym,
  type Locale,
  type Me,
} from '@inkwell/shared';

import { Wordmark } from '@/components/marketing/wordmark';
import { useCryptoState } from '@/components/providers/crypto-provider';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorText } from '@/components/ui/error-text';
import { Field, Input } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import {
  checkPseudonym,
  completeOnboarding,
  confirmRecoverySetup,
  passkeyOptions,
  passkeyVerify,
  requestEmailCode,
  verifyEmailCode,
} from '@/features/auth/actions';
import { cryptoClient } from '@/features/crypto/client';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { CodeInput } from './code-input';
import { RecoveryGrid } from './recovery-grid';

type Step =
  | 'entry'
  | 'email'
  | 'code'
  | 'age'
  | 'declined'
  | 'pseudonym'
  | 'recovery'
  | 'unlock'
  | 'languages';

const ORDER: Step[] = [
  'entry',
  'email',
  'code',
  'age',
  'declined',
  'pseudonym',
  'recovery',
  'unlock',
  'languages',
];

interface AuthPanelProps {
  /** Where to go after everything is done: new accounts land in the editor, returning ones on /today. */
  onFinished?: () => void;
  initialIntent?: 'create' | 'sign-in';
  appleClientId?: string | undefined;
}

/**
 * The whole onboarding in one 440 px panel: steps slide horizontally, the
 * background stays, nothing reloads. Under a minute for a new account.
 */
export function AuthPanel({
  onFinished,
  initialIntent = 'sign-in',
  appleClientId,
}: AuthPanelProps) {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const crypto = useCryptoState();
  const [step, setStep] = useState<Step>('entry');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [me, setMe] = useState<Me | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  const go = (next: Step) => {
    setDirection(ORDER.indexOf(next) >= ORDER.indexOf(step) ? 1 : -1);
    setError(null);
    setStep(next);
  };

  const finish = () => {
    if (onFinished) onFinished();
    else router.replace('/today');
  };

  // --- Entry --------------------------------------------------------------------------------
  const signInWithPasskey = () => {
    startTransition(async () => {
      const options = await passkeyOptions('authenticate');
      if (!options.ok) return setError(options.error);
      try {
        const response = await startAuthentication({
          optionsJSON: options.data.options as Parameters<
            typeof startAuthentication
          >[0]['optionsJSON'],
        });
        const result = await passkeyVerify('authenticate', options.data.challengeId, response);
        if (!result.ok) return setError(result.error);
        afterSignIn('needsOnboarding' in result.data && result.data.needsOnboarding);
      } catch {
        setError('PASSKEY_INVALID');
      }
    });
  };

  const afterSignIn = (needsOnboarding: boolean) => {
    if (needsOnboarding) return go('age');
    if (crypto.hasKey === false) return go('unlock');
    finish();
  };

  // --- E-mail -------------------------------------------------------------------------------
  const sendCode = () => {
    startTransition(async () => {
      const result = await requestEmailCode(email, locale);
      if (!result.ok) return setError(result.error);
      setCode('');
      go('code');
    });
  };

  const verify = (value: string) => {
    startTransition(async () => {
      const result = await verifyEmailCode(email, value, locale);
      if (!result.ok) return setError(result.error);
      setMe(result.data.me);
      afterSignIn(result.data.needsOnboarding);
    });
  };

  useEffect(() => {
    if (step === 'code' && code.length === 6 && !pending) verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verify once per complete code
  }, [code, step]);

  // --- Pseudonym ----------------------------------------------------------------------------
  const [pseudonym, setPseudonym] = useState(() => suggestPseudonym(locale));
  const [availability, setAvailability] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step !== 'pseudonym') return;
    if (!PSEUDONYM_PATTERN.test(pseudonym) || pseudonym.length < 3 || pseudonym.length > 24) {
      setAvailability('invalid');
      return;
    }
    setAvailability('checking');
    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      void checkPseudonym(pseudonym).then((result) => {
        setAvailability(result.ok ? (result.data.available ? 'available' : 'taken') : 'invalid');
      });
    }, 400);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [pseudonym, step]);

  // --- Recovery -----------------------------------------------------------------------------
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (step === 'recovery' && !mnemonic) {
      void cryptoClient
        .generateMnemonic()
        .then(setMnemonic)
        .catch(() => setError('INTERNAL'));
    }
  }, [step, mnemonic]);

  const storeKey = () => {
    if (!mnemonic) return;
    startTransition(async () => {
      try {
        await cryptoClient.setupFromMnemonic(mnemonic);
        await crypto.refresh();
        await confirmRecoverySetup();
        go('languages');
      } catch {
        setError('INTERNAL');
      }
    });
  };

  // --- Unlock on a new device ---------------------------------------------------------------
  const [unlockWords, setUnlockWords] = useState('');
  const [unlockInvalid, setUnlockInvalid] = useState(false);

  const unlock = () => {
    startTransition(async () => {
      const valid = await cryptoClient.validateMnemonic(unlockWords);
      if (!valid) return setUnlockInvalid(true);
      await cryptoClient.setupFromMnemonic(unlockWords);
      await crypto.refresh();
      finish();
    });
  };

  // --- Languages & completion -----------------------------------------------------------------
  const [roomLocales, setRoomLocales] = useState<Locale[]>([locale]);

  const complete = () => {
    startTransition(async () => {
      const result = await completeOnboarding({
        ageConfirmed: true,
        pseudonym,
        roomLocales,
        locale,
      });
      if (!result.ok) return setError(result.error);
      setMe(result.data);
      router.replace('/write?first=1');
    });
  };

  const appleHref = appleClientId ? `/api/auth/apple/start` : null;

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="mb-6 flex items-center justify-between">
        <Wordmark />
        {step !== 'entry' && step !== 'declined' && step !== 'languages' && step !== 'unlock' ? (
          <button
            type="button"
            onClick={() => go(step === 'code' ? 'email' : 'entry')}
            className="touch-target -mr-2 text-ink-secondary hover:text-ink"
            aria-label={common('back')}
          >
            <Icon name="arrow-left" />
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden">
        <div
          key={step}
          className={cn('auth-step', direction === 1 ? 'auth-step-forward' : 'auth-step-back')}
        >
          {step === 'entry' ? (
            <div className="flex flex-col gap-3">
              <p className="mb-3 font-serif text-xl text-balance">{t('intro')}</p>
              {passkeySupported ? (
                <Button
                  variant={initialIntent === 'create' ? 'secondary' : 'primary'}
                  size="lg"
                  onClick={signInWithPasskey}
                  busy={pending}
                >
                  <Icon name="key" size={18} />
                  {t('passkey')}
                </Button>
              ) : null}
              <Button
                variant={initialIntent === 'create' || !passkeySupported ? 'primary' : 'secondary'}
                size="lg"
                onClick={() => go('email')}
              >
                {t('email')}
              </Button>
              {appleHref ? (
                <a
                  href={appleHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line-strong font-medium"
                >
                  {t('apple')}
                </a>
              ) : (
                <Button variant="secondary" size="lg" disabled title={t('appleUnavailable')}>
                  {t('apple')}
                </Button>
              )}
              {error === 'PASSKEY_INVALID' ? (
                <p className="text-[13px] text-ink-secondary">{t('passkeyUnavailable')}</p>
              ) : (
                <ErrorText code={error} />
              )}
              <button
                type="button"
                onClick={() => router.push('/rooms')}
                className="mt-4 self-center text-accent underline-offset-4 hover:underline"
              >
                {common('readOnly')}
              </button>
            </div>
          ) : null}

          {step === 'email' ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                sendCode();
              }}
            >
              <h2 className="font-serif text-xl">{t('emailStep.title')}</h2>
              <Field label={t('emailStep.label')} error={<ErrorText code={error} />}>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={describedBy}
                  />
                )}
              </Field>
              <Button type="submit" size="lg" busy={pending}>
                {t('emailStep.send')}
              </Button>
            </form>
          ) : null}

          {step === 'code' ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-xl">{t('emailStep.sent')}</h2>
              <p className="text-sm text-ink-secondary">{email}</p>
              <CodeInput
                value={code}
                onChange={setCode}
                label={t('emailStep.codeLabel')}
                disabled={pending}
              />
              <p className="text-[13px] text-ink-secondary">{t('emailStep.codeHint')}</p>
              <ErrorText code={error} />
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  className="text-accent underline-offset-4 hover:underline"
                  onClick={sendCode}
                  disabled={pending}
                >
                  {t('emailStep.resend')}
                </button>
                <button
                  type="button"
                  className="text-ink-secondary hover:text-ink"
                  onClick={() => go('email')}
                >
                  {t('emailStep.changeEmail')}
                </button>
              </div>
            </div>
          ) : null}

          {step === 'age' ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-xl">{t('age.question')}</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" onClick={() => go('declined')}>
                  {t('age.no')}
                </Button>
                <Button size="lg" onClick={() => go('pseudonym')}>
                  {t('age.yes')}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'declined' ? (
            <div className="flex flex-col gap-4">
              <p className="font-serif text-xl text-balance">{t('age.declined')}</p>
              <a
                href="tel:147"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong font-medium"
              >
                <Icon name="phone" size={18} />
                {t('age.declinedCall')}
              </a>
            </div>
          ) : null}

          {step === 'pseudonym' ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (availability === 'available') go('recovery');
              }}
            >
              <h2 className="font-serif text-xl">{t('pseudonym.title')}</h2>
              <Field
                label={t('pseudonym.label')}
                hint={t('pseudonym.rules')}
                error={
                  availability === 'taken'
                    ? t('pseudonym.taken')
                    : availability === 'invalid' && pseudonym.length > 0
                      ? t('pseudonym.invalid')
                      : null
                }
              >
                {({ id, describedBy }) => (
                  <div className="relative">
                    <Input
                      id={id}
                      value={pseudonym}
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => setPseudonym(e.target.value.toLowerCase())}
                      aria-describedby={describedBy}
                      className="pr-10"
                    />
                    <span
                      className="absolute inset-y-0 right-3 flex items-center text-sm text-ink-secondary"
                      aria-live="polite"
                    >
                      {availability === 'checking' ? (
                        <span className="sr-only">{t('pseudonym.checking')}</span>
                      ) : null}
                      {availability === 'available' ? (
                        <Icon
                          name="check"
                          className="text-accent"
                          label={t('pseudonym.available')}
                        />
                      ) : null}
                    </span>
                  </div>
                )}
              </Field>
              <p className="text-[13px] text-ink-secondary">{t('pseudonym.hint')}</p>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-accent underline-offset-4 hover:underline"
                  onClick={() => setPseudonym(suggestPseudonym(locale))}
                >
                  {t('pseudonym.suggest')}
                </button>
                <Button type="submit" disabled={availability !== 'available'}>
                  {common('continue')}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 'recovery' ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-xl">{t('recovery.title')}</h2>
              <p className="text-ink-secondary text-pretty">{t('recovery.explain')}</p>
              {mnemonic ? (
                <RecoveryGrid mnemonic={mnemonic} />
              ) : (
                <div className="skeleton-line h-32" />
              )}
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <span>{t('recovery.ack')}</span>
              </label>
              <ErrorText code={error} />
              <Button
                size="lg"
                disabled={!acknowledged || !mnemonic}
                busy={pending}
                onClick={storeKey}
              >
                {t('recovery.saved')}
              </Button>
            </div>
          ) : null}

          {step === 'unlock' ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                unlock();
              }}
            >
              <h2 className="font-serif text-xl">{t('unlock.title')}</h2>
              <p className="text-ink-secondary text-pretty">{t('unlock.explain')}</p>
              <Field label={t('unlock.label')} error={unlockInvalid ? t('unlock.invalid') : null}>
                {({ id, describedBy }) => (
                  <textarea
                    id={id}
                    value={unlockWords}
                    onChange={(e) => {
                      setUnlockWords(e.target.value);
                      setUnlockInvalid(false);
                    }}
                    aria-describedby={describedBy}
                    autoComplete="off"
                    spellCheck={false}
                    rows={3}
                    className="w-full rounded-md border border-line-strong bg-paper px-3 py-2 font-serif text-lg focus:border-accent"
                  />
                )}
              </Field>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-ink-secondary hover:text-ink"
                  onClick={finish}
                >
                  {t('unlock.skip')}
                </button>
                <Button
                  type="submit"
                  busy={pending}
                  disabled={unlockWords.trim().split(/\s+/).length !== 12}
                >
                  {t('unlock.unlock')}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 'languages' ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-xl">{t('languages.title')}</h2>
              <p className="text-ink-secondary">{t('languages.hint')}</p>
              <div className="flex flex-wrap gap-2">
                {LOCALES.map((option) => (
                  <Chip
                    key={option}
                    active={roomLocales.includes(option)}
                    onClick={() =>
                      setRoomLocales((current) => {
                        if (current.includes(option))
                          return current.length > 1 ? current.filter((l) => l !== option) : current;
                        return [...current, option];
                      })
                    }
                  >
                    {common(`locales.${option}`)}
                  </Chip>
                ))}
              </div>
              <ErrorText code={error} />
              <Button size="lg" busy={pending} onClick={complete}>
                {common('continue')}
              </Button>
              {me ? <span className="sr-only">{me.pseudonym}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
