import { getTranslations } from 'next-intl/server';

import { LOCALES } from '@inkwell/shared';

import { RoomList } from '@/components/rooms/room-list';
import { getMe } from '@/features/auth/session';
import { getRooms } from '@/features/posts/queries';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('rooms');
  return { title: t('title') };
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const me = await getMe();
  const t = await getTranslations('rooms');
  const rooms = await getRooms(me ? me.roomLocales : [...LOCALES]);
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">{t('title')}</h1>
      <RoomList rooms={rooms} initialKind={kind === 'fiction' ? 'fiction' : 'reflection'} />
    </div>
  );
}
