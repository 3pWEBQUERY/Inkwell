import { getTranslations } from 'next-intl/server';

import { isSettingsGroup, SettingsGroupContent } from './settings-group';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; group: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group } = await params;
  const t = await getTranslations('settings');
  return {
    title: isSettingsGroup(group) ? t(`groups.${group}`) : t('title'),
    robots: { index: false },
  };
}

export default async function SettingsPage({ params }: Props) {
  const { locale, group } = await params;
  return <SettingsGroupContent group={group} locale={locale} />;
}
