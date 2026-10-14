import { getTranslations } from 'next-intl/server';

import { JournalList } from '@/components/journal/journal-list';
import { PageHeader } from '@/components/ui/page-header';
import { getMe } from '@/features/auth/session';
import { getJournal } from '@/features/posts/queries';
import { redirect } from '@/i18n/navigation';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('journal');
  return { title: t('title'), robots: { index: false } };
}

export default async function JournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ focus?: string; open?: string }>;
}) {
  const { locale } = await params;
  const me = await getMe();
  if (!me) {
    redirect({ href: '/sign-in', locale });
    return null;
  }
  const t = await getTranslations('journal');
  const { focus, open } = await searchParams;
  const journal = await getJournal();
  return (
    <div>
      <PageHeader title={t('title')} />
      <JournalList initial={journal.items} focusSearch={focus === 'search'} openId={open ?? null} />
    </div>
  );
}
