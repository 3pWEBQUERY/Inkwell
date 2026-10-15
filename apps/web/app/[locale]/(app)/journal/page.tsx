import { getTranslations } from 'next-intl/server';

import { JournalList } from '@/components/journal/journal-list';
import { OnThisDay } from '@/components/journal/on-this-day';
import { PostCard } from '@/components/rooms/post-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { TabLinks } from '@/components/ui/tab-links';
import { getMe } from '@/features/auth/session';
import { getBookmarks, getJournal } from '@/features/posts/queries';
import { redirect } from '@/i18n/navigation';
import { isDayKey } from '@/lib/format';

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
  searchParams: Promise<{ focus?: string; open?: string; view?: string; day?: string }>;
}) {
  const { locale } = await params;
  const me = await getMe();
  if (!me) {
    redirect({ href: '/sign-in', locale });
    return null;
  }
  const t = await getTranslations('journal');
  const { focus, open, view, day } = await searchParams;
  const kept = view === 'kept';
  const tabs = (
    <TabLinks
      label={t('views.label')}
      tabs={[
        { href: '/journal', label: t('views.written'), active: !kept },
        { href: '/journal?view=kept', label: t('views.kept'), active: kept },
      ]}
    />
  );

  if (kept) {
    const bookmarks = await getBookmarks().catch(() => []);
    return (
      <div>
        <PageHeader title={t('title')} actions={tabs} />
        {bookmarks.length === 0 ? (
          <EmptyState>{t('keptEmpty')}</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarks.map((post) => (
              <PostCard key={post.id} post={post} showRoom />
            ))}
          </div>
        )}
      </div>
    );
  }

  const journal = await getJournal();
  return (
    <div>
      <PageHeader title={t('title')} actions={tabs} />
      <div className="mb-8 xl:hidden">
        <OnThisDay compact />
      </div>
      <JournalList
        initial={journal.items}
        focusSearch={focus === 'search'}
        openId={open ?? null}
        day={isDayKey(day) ? day : null}
      />
    </div>
  );
}
