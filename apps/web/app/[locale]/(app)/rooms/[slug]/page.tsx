import { notFound } from 'next/navigation';

import { Helplines } from '@/components/reading/helplines';
import { RoomFeed } from '@/components/rooms/room-feed';
import { RoomHeader } from '@/components/rooms/room-header';
import { getMe } from '@/features/auth/session';
import { getRoom, getRoomFeed, getVapidPublicKey } from '@/features/posts/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; highlight?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoom(slug);
  return { title: room?.name ?? '', description: room?.description };
}

export default async function RoomPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) notFound();
  const { sort, highlight } = await searchParams;
  const initialSort =
    room.kind === 'fiction'
      ? sort === 'week' || sort === 'top' || sort === 'new'
        ? sort
        : room.sortDefault
      : 'new';
  const [page, vapid, me] = await Promise.all([
    getRoomFeed(slug, { sort: initialSort }),
    getVapidPublicKey().catch(() => null),
    getMe(),
  ]);

  return (
    <div>
      <RoomHeader room={room} vapidPublicKey={vapid} />
      <RoomFeed
        slug={slug}
        kind={room.kind}
        initialSort={initialSort}
        initialPage={page}
        highlightId={highlight}
        canWrite={Boolean(me) && room.joined}
        signedIn={Boolean(me)}
      />
      {room.showHelplines ? <Helplines /> : null}
    </div>
  );
}
