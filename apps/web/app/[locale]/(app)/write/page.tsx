import { getTranslations } from 'next-intl/server';

import { WritePage } from './write-page';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('write'), robots: { index: false } };
}

export default async function Write({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    first?: string;
    edit?: string;
    editPrivate?: string;
    prompt?: string;
    room?: string;
    draft?: string;
    about?: string;
  }>;
}) {
  const { locale } = await params;
  return <WritePage locale={locale} searchParams={await searchParams} intercepted={false} />;
}
