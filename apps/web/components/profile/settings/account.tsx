'use client';

import { startRegistration } from '@simplewebauthn/browser';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { PSEUDONYM_PATTERN, type Locale, type Me, type PasskeyView } from '@inkwell/shared';

import { CodeInput } from '@/components/auth/code-input';
import { useAnnouncer } from '@/components/providers/announcer';
import { Button } from '@/components/ui/button';
import { ErrorText } from '@/components/ui/error-text';
import { Field, Input } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { passkeyOptions, passkeyVerify, signOut } from '@/features/auth/actions';
import {
  confirmEmailChange,
  removePasskey,
  renamePasskey,
  requestEmailChange,
  updateMe,
} from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

export function AccountSettings({ me, passkeys }: { me: Me; passkeys: PasskeyView[] }) {
  const t = useTranslations('settings.account');
  const auth = useTranslations('auth');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { announce } = useAnnouncer();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'code'>('idle');
  const [code, setCode] = useState('');

  const [pseudonym, setPseudonym] = useState(me.pseudonym);
  const lockUntil = useMemo(
    () =>
      me.pseudonymChangedAt
        ? new Date(new Date(me.pseudonymChangedAt).getTime() + 30 * 86_400_000)
        : null,
    [me.pseudonymChangedAt],
  );
  const [locked, setLocked] = useState(false);
  useEffect(() => setLocked(lockUntil !== null && lockUntil.getTime() > Date.now()), [lockUntil]);

  const sendEmailCode = () => {
    startTransition(async () => {
      setError(null);
      const result = await requestEmailChange(newEmail);
      if (!result.ok) return setError(result.error);
      setEmailStep('code');
      announce(t('emailCodeSent'));
    });
  };

  const confirmEmail = () => {
    startTransition(async () => {
      const result = await confirmEmailChange(newEmail, code);
      if (!result.ok) return setError(result.error);
      setEmailStep('idle');
      setNewEmail('');
      setCode('');
      announce(t('emailChanged'));
      router.refresh();
    });
  };

  const addPasskey = () => {
    startTransition(async () => {
      setError(null);
      const options = await passkeyOptions('register');
      if (!options.ok) return setError(options.error);
      try {
        const response = await startRegistration({
          optionsJSON: options.data.options as Parameters<
            typeof startRegistration
          >[0]['optionsJSON'],
        });
        const result = await passkeyVerify('register', options.data.challengeId, response);
        if (!result.ok) return setError(result.error);
        announce(t('passkeyAdded'));
        router.refresh();
      } catch {
        setError('PASSKEY_INVALID');
      }
    });
  };

  const changePseudonym = () => {
    startTransition(async () => {
      setError(null);
      const result = await updateMe({ pseudonym });
      if (!result.ok) return setError(result.error);
      announce(t('pseudonymChanged'));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="font-medium">{t('email')}</h3>
        <p className="mt-1 text-ink-secondary">{me.email}</p>
        {emailStep === 'idle' ? (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendEmailCode();
            }}
          >
            <Field label={t('newEmail')}>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-fit"
              disabled={!newEmail}
              busy={pending}
            >
              {t('changeEmail')}
            </Button>
          </form>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <CodeInput value={code} onChange={setCode} label={auth('emailStep.codeLabel')} />
            <Button
              size="sm"
              className="w-fit"
              onClick={confirmEmail}
              disabled={code.length !== 6}
              busy={pending}
            >
              {common('confirm')}
            </Button>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-medium">{t('passkeys')}</h3>
        {passkeys.length === 0 ? (
          <p className="mt-1 text-[13px] text-ink-secondary">{t('noPasskeys')}</p>
        ) : null}
        <ul className="mt-2 divide-y divide-line">
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey.id} passkey={passkey} locale={locale} />
          ))}
        </ul>
        <Button variant="secondary" size="sm" className="mt-3" onClick={addPasskey} busy={pending}>
          <Icon name="key" size={16} />
          {t('addPasskey')}
        </Button>
      </section>

      <section>
        <h3 className="font-medium">{t('apple')}</h3>
        <p className="mt-1 text-ink-secondary">{t('appleNotLinked')}</p>
      </section>

      <section>
        <h3 className="font-medium">{t('pseudonym')}</h3>
        <form
          className="mt-2 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            changePseudonym();
          }}
        >
          <Field
            label={t('pseudonym')}
            hint={
              locked && lockUntil
                ? t('pseudonymLock', { date: formatDate(lockUntil, locale) })
                : auth('pseudonym.rules')
            }
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                value={pseudonym}
                disabled={locked}
                onChange={(e) => setPseudonym(e.target.value.toLowerCase())}
                aria-describedby={describedBy}
              />
            )}
          </Field>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="w-fit"
            disabled={locked || pseudonym === me.pseudonym || !PSEUDONYM_PATTERN.test(pseudonym)}
            busy={pending}
          >
            {t('changePseudonym')}
          </Button>
        </form>
      </section>

      <ErrorText code={error} />

      <section className="border-t border-line pt-6">
        <Button
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              await signOut();
              router.replace('/');
            })
          }
          busy={pending}
        >
          {t('signOut')}
        </Button>
      </section>
    </div>
  );
}

function PasskeyRow({ passkey, locale }: { passkey: PasskeyView; locale: Locale }) {
  const t = useTranslations('settings.account');
  const router = useRouter();
  const [name, setName] = useState(passkey.name);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 py-3">
      {editing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={t('passkeyName')}
          className="h-9 flex-1"
        />
      ) : (
        <span className="flex-1">
          <span className="block">{passkey.name}</span>
          <span className="text-[13px] text-ink-tertiary">
            {formatDate(passkey.createdAt, locale)}
          </span>
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        busy={pending}
        onClick={() => {
          if (!editing) return setEditing(true);
          startTransition(async () => {
            await renamePasskey(passkey.id, name);
            setEditing(false);
            router.refresh();
          });
        }}
      >
        {editing ? t('rename') : t('rename')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-warn"
        onClick={() =>
          startTransition(async () => {
            await removePasskey(passkey.id);
            router.refresh();
          })
        }
      >
        {t('remove')}
      </Button>
    </li>
  );
}
