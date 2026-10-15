import { getTranslations } from 'next-intl/server';

import { getRoom } from '@/features/posts/queries';

/** Context column on wide screens: the room rules, always visible while reading. */
export default async function RoomContext({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room?.rules) return null;
  const t = await getTranslations('rooms');
  return (
    <div className="rounded-lg bg-paper-sunken p-5">
      <h2 className="label">{t('rules')}</h2>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">{room.rules}</p>
    </div>
  );
}
