import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { PostCard } from '@/components/rooms/post-card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { getProfile } from '@/features/posts/queries';
import { formatMonthYear } from '@/lib/format';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ pseudonym: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pseudonym } = await params;
  return { title: `@${pseudonym}` };
}

/** Public profile as others see it: pseudonym, avatar, public texts. Nothing else, no numbers. */
export default async function ProfilePage({ params }: Props) {
  const { pseudonym } = await params;
  const profile = await getProfile(pseudonym);
  if (!profile) notFound();
  const t = await getTranslations('profile');
  const me = await getTranslations('me');
  const current = (await getLocale()) as Locale;
  return (
    <div>
      <header className="flex items-center gap-4">
        <Avatar avatar={profile.avatar} pseudonym={profile.pseudonym} size={64} />
        <div>
          <h1 className="display text-[1.875rem] md:text-[2.125rem]">{profile.pseudonym}</h1>
          <p className="text-[13px] text-ink-secondary">
            {me('memberSince', { date: formatMonthYear(profile.memberSince, current) })}
          </p>
        </div>
      </header>
      <div className="mt-6">
        {profile.posts.length === 0 ? (
          <EmptyState>{t('noPosts')}</EmptyState>
        ) : (
          profile.posts.map((post) => <PostCard key={post.id} post={post} showRoom />)
        )}
      </div>
    </div>
  );
}
