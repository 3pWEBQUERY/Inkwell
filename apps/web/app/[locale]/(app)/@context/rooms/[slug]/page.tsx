import { getTranslations } from 'next-intl/server';

import { getRoom } from '@/features/posts/queries';

/** Context column on wide screens: the room rules, always visible while reading. */
export default async function RoomContext({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room?.rules) return null;
  const t = await getTranslations('rooms');
  return (
    <div className="rounded-md border border-line p-4">
      <h2 className="text-sm font-medium text-ink-secondary">{t('rules')}</h2>
      <p className="mt-2 text-[15px] text-ink-secondary">{room.rules}</p>
    </div>
  );
}
