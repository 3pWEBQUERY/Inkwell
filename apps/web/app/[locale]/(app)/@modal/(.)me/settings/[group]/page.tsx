import { getTranslations } from 'next-intl/server';

import { SettingsOverlay } from '@/components/profile/settings/settings-overlay';

import {
  isSettingsGroup,
  SettingsGroupContent,
} from '../../../../me/settings/[group]/settings-group';

export default async function InterceptedSettings({
  params,
}: {
  params: Promise<{ locale: string; group: string }>;
}) {
  const { locale, group } = await params;
  const t = await getTranslations('settings');
  return (
    <SettingsOverlay title={isSettingsGroup(group) ? t(`groups.${group}`) : t('title')}>
      <SettingsGroupContent group={group} locale={locale} />
    </SettingsOverlay>
  );
}
