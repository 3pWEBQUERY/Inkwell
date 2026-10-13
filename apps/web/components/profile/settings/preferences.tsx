'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import {
  LOCALES,
  type Expiry,
  type Locale,
  type Me,
  type UserSettings,
  type Visibility,
} from '@inkwell/shared';

import { LanguageSwitcher } from '@/components/marketing/language-switcher';
import { useAnnouncer } from '@/components/providers/announcer';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useErrorMessage } from '@/components/ui/error-text';
import { Switch } from '@/components/ui/switch';
import { updateMe } from '@/features/posts/actions';
import { subscribeToPush } from '@/features/pwa/push';
import { cn } from '@/lib/cn';

function useSaveSettings(me: Me) {
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const common = useTranslations('common');
  const [, startTransition] = useTransition();
  const [settings, setSettings] = useState<UserSettings>(me.settings);
  const save = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    startTransition(async () => {
      const result = await updateMe({ settings: patch });
      if (!result.ok) return announce(message(result.error) ?? '');
      announce(common('saved'));
    });
  };
  return { settings, save };
}

function OptionRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-10 rounded-md border px-3.5 text-sm state-toggle',
              value === option.value
                ? 'border-accent bg-accent-soft'
                : 'border-line-strong text-ink-secondary',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function WritingSettings({ me }: { me: Me }) {
  const t = useTranslations('settings.writing');
  const completion = useTranslations('completion');
  const { settings, save } = useSaveSettings(me);
  return (
    <div className="flex flex-col gap-8">
      <OptionRow<Visibility>
        label={t('defaultVisibility')}
        value={settings.defaultVisibility}
        options={[
          { value: 'private', label: completion('visibility.private.title') },
          { value: 'anonymous', label: completion('visibility.anonymous.title') },
          { value: 'public', label: completion('visibility.public.title') },
        ]}
        onChange={(defaultVisibility) => save({ defaultVisibility })}
      />
      <OptionRow<Expiry>
        label={t('defaultExpiry')}
        value={settings.defaultExpiry}
        options={[
          { value: 'none', label: completion('expiry.none') },
          { value: '24h', label: completion('expiry.24h') },
          { value: '7d', label: completion('expiry.7d') },
        ]}
        onChange={(defaultExpiry) => save({ defaultExpiry })}
      />
      <div>
        <label htmlFor="font-size" className="font-medium">
          {t('fontSize')} · {settings.fontSize} px
        </label>
        <input
          id="font-size"
          type="range"
          min={17}
          max={22}
          step={1}
          value={settings.fontSize}
          onChange={(e) => save({ fontSize: Number(e.target.value) })}
          className="mt-2 w-full accent-accent"
        />
        <p
          className={cn('prose-reading mt-3', settings.editorFont === 'sans' && 'sans')}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {completion('visibility.private.body')}
        </p>
      </div>
      <OptionRow<'serif' | 'sans'>
        label={t('font')}
        value={settings.editorFont}
        options={[
          { value: 'serif', label: t('serif') },
          { value: 'sans', label: t('sans') },
        ]}
        onChange={(editorFont) => save({ editorFont })}
      />
    </div>
  );
}

export function AppearanceSettings({ me }: { me: Me }) {
  const t = useTranslations('settings.appearance');
  const { settings, save } = useSaveSettings(me);
  const theme = useTheme();
  return (
    <div className="flex flex-col gap-8">
      <OptionRow<'light' | 'dark' | 'system'>
        label={t('theme')}
        value={settings.theme}
        options={[
          { value: 'light', label: t('light') },
          { value: 'dark', label: t('dark') },
          { value: 'system', label: t('system') },
        ]}
        onChange={(value) => {
          theme.setTheme(value);
          save({ theme: value });
        }}
      />
      <OptionRow<'system' | 'reduce'>
        label={t('motion')}
        value={settings.reduceMotion}
        options={[
          { value: 'system', label: t('motionSystem') },
          { value: 'reduce', label: t('motionReduce') },
        ]}
        onChange={(value) => {
          theme.setMotion(value);
          save({ reduceMotion: value });
        }}
      />
    </div>
  );
}

export function NotificationSettings({
  me,
  vapidPublicKey,
}: {
  me: Me;
  vapidPublicKey: string | null;
}) {
  const t = useTranslations('settings.notifications');
  const { settings, save } = useSaveSettings(me);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-medium">{t('rooms')}</h3>
        <p className="text-[13px] text-ink-secondary">{t('roomsHint')}</p>
        <div className="mt-2 flex items-center gap-3">
          {permission === 'granted' ? (
            <span className="text-sm text-ink-secondary">{t('enabled')}</span>
          ) : permission === 'denied' ? (
            <span className="text-sm text-ink-secondary">{t('blocked')}</span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void subscribeToPush(vapidPublicKey).then(() =>
                  setPermission('Notification' in window ? Notification.permission : 'unsupported'),
                )
              }
            >
              {t('enable')}
            </Button>
          )}
        </div>
        {ios && !standalone ? (
          <p className="mt-2 text-[13px] text-ink-tertiary">{t('ios')}</p>
        ) : null}
      </div>
      <Switch
        checked={settings.dailyFeedbackDigest}
        onChange={(dailyFeedbackDigest) => save({ dailyFeedbackDigest })}
        label={t('digest')}
        hint={t('digestHint')}
      />
      <Switch
        checked={settings.commentNotifications}
        onChange={(commentNotifications) => save({ commentNotifications })}
        label={t('comments')}
        hint={t('commentsHint')}
      />
    </div>
  );
}

export function LanguageSettings({ me }: { me: Me }) {
  const t = useTranslations('settings.languages');
  const common = useTranslations('common');
  const { announce } = useAnnouncer();
  const [, startTransition] = useTransition();
  const [roomLocales, setRoomLocales] = useState<Locale[]>(me.roomLocales);

  const toggle = (locale: Locale) => {
    const next = roomLocales.includes(locale)
      ? roomLocales.length > 1
        ? roomLocales.filter((l) => l !== locale)
        : roomLocales
      : [...roomLocales, locale];
    setRoomLocales(next);
    startTransition(async () => {
      const result = await updateMe({ roomLocales: next });
      if (result.ok) announce(common('saved'));
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-medium">{t('rooms')}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {LOCALES.map((locale) => (
            <Chip key={locale} active={roomLocales.includes(locale)} onClick={() => toggle(locale)}>
              {common(`locales.${locale}`)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium">{t('ui')}</h3>
        <div className="mt-2">
          <LanguageSwitcher compact />
        </div>
      </div>
    </div>
  );
}
