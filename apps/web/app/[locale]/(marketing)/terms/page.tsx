import { getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/marketing/legal-page';
import { TERMS } from '@/content/legal';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('terms') };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalPage document={TERMS[locale as Locale]} />;
}
