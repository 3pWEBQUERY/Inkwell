import { getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/marketing/legal-page';
import { PRIVACY } from '@/content/legal';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('privacy') };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage document={PRIVACY[locale as Locale]} />;
}
