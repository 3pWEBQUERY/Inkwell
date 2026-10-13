import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AccountSettings } from '@/components/profile/settings/account';
import {
  AboutSettings,
  BlockedSettings,
  DataSettings,
} from '@/components/profile/settings/data-and-more';
import {
  AppearanceSettings,
  LanguageSettings,
  NotificationSettings,
  WritingSettings,
} from '@/components/profile/settings/preferences';
import { SecuritySettings } from '@/components/profile/settings/security';
import { getMe } from '@/features/auth/session';
import { getBlocks, getPasskeys, getSessions, getVapidPublicKey } from '@/features/posts/queries';
import { redirect } from '@/i18n/navigation';

export const SETTINGS_GROUPS = [
  'account',
  'security',
  'writing',
  'appearance',
  'notifications',
  'languages',
  'blocked',
  'data',
  'about',
] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export function isSettingsGroup(value: string): value is SettingsGroup {
  return (SETTINGS_GROUPS as readonly string[]).includes(value);
}

/** Loads what a group needs on the server and renders its client component. */
export async function SettingsGroupContent({ group, locale }: { group: string; locale: string }) {
  if (!isSettingsGroup(group)) notFound();
  const me = await getMe();
  if (!me) {
    redirect({ href: '/sign-in', locale });
    return null;
  }
  const t = await getTranslations('settings');

  let content: React.ReactNode;
  switch (group) {
    case 'account':
      content = <AccountSettings me={me} passkeys={await getPasskeys().catch(() => [])} />;
      break;
    case 'security':
      content = <SecuritySettings me={me} sessions={await getSessions().catch(() => [])} />;
      break;
    case 'writing':
      content = <WritingSettings me={me} />;
      break;
    case 'appearance':
      content = <AppearanceSettings me={me} />;
      break;
    case 'notifications':
      content = (
        <NotificationSettings
          me={me}
          vapidPublicKey={await getVapidPublicKey().catch(() => null)}
        />
      );
      break;
    case 'languages':
      content = <LanguageSettings me={me} />;
      break;
    case 'blocked':
      content = <BlockedSettings blocks={await getBlocks().catch(() => [])} />;
      break;
    case 'data':
      content = <DataSettings me={me} />;
      break;
    case 'about':
      content = <AboutSettings />;
      break;
    default:
      notFound();
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">{t(`groups.${group}`)}</h1>
      {content}
    </div>
  );
}
