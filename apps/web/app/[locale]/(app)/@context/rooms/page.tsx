import { getTranslations } from 'next-intl/server';

import { YourRooms } from '@/components/rooms/your-rooms';
import { Icon } from '@/components/ui/icon';
import { getMe } from '@/features/auth/session';
import { getRooms } from '@/features/posts/queries';

/** Rooms context column: what the two kinds of rooms are for, and the member's own rooms. */
export default async function RoomsContext() {
  const t = await getTranslations('rooms');
  const marketing = await getTranslations('marketing.rooms');
  const me = await getMe();
  const rooms = me ? await getRooms(me.roomLocales).catch(() => []) : [];
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="room-kinds" className="rounded-lg bg-paper-sunken p-5">
        <h2 id="room-kinds" className="label">
          {t('kinds.title')}
        </h2>
        <div className="mt-3 flex flex-col gap-4 text-[0.875rem] leading-relaxed">
          <p>
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="leaf" size={15} className="text-accent-text" />
              {marketing('reflection.title')}
            </span>
            <span className="mt-1 block text-ink-secondary">{marketing('reflection.body')}</span>
          </p>
          <p>
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="book" size={15} className="text-accent-text" />
              {marketing('fiction.title')}
            </span>
            <span className="mt-1 block text-ink-secondary">{marketing('fiction.body')}</span>
          </p>
        </div>
      </section>
      <YourRooms rooms={rooms} />
    </div>
  );
}
