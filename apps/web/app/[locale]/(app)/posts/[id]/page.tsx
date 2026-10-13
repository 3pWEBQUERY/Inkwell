import { notFound } from 'next/navigation';

import { ReadingView } from '@/components/reading/reading-view';
import { getMe } from '@/features/auth/session';
import { getComments, getPost, getRoom, getSeries } from '@/features/posts/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { robots: { index: false } };
  // Anonymous and expiring texts are not indexed; profile texts are.
  const indexable = post.visibility === 'public' && !post.expiresAt;
  return { title: post.title ?? post.preview, robots: { index: indexable, follow: indexable } };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const [post, me] = await Promise.all([getPost(id), getMe()]);
  if (!post) notFound();
  const [comments, room, series] = await Promise.all([
    getComments(id).catch(() => []),
    getRoom(post.room.slug),
    post.series ? getSeries(post.series.id) : Promise.resolve(null),
  ]);

  let chapterNav: { previous: string | null; next: string | null } | null = null;
  if (series) {
    const index = series.chapters.findIndex((chapter) => chapter.postId === post.id);
    chapterNav = {
      previous: index > 0 ? (series.chapters[index - 1]?.postId ?? null) : null,
      next:
        index >= 0 && index < series.chapters.length - 1
          ? (series.chapters[index + 1]?.postId ?? null)
          : null,
    };
  }

  return (
    <ReadingView
      post={post}
      comments={comments}
      editorFont={me?.settings.editorFont ?? 'serif'}
      fontSize={me?.settings.fontSize ?? 19}
      showHelplines={room?.showHelplines ?? false}
      chapterNav={chapterNav}
    />
  );
}
