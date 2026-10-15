import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { RoomInitial } from './room-initial';

import type { RoomView } from '@/features/posts/queries';

/** The rooms a member has joined, as quick links. Renders nothing when there are none. */
export async function YourRooms({ rooms }: { rooms: RoomView[] }) {
  const t = await getTranslations('today');
  const joined = rooms.filter((room) => room.joined);
  if (joined.length === 0) return null;
  return (
    <section aria-labelledby="your-rooms">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="your-rooms" className="label">
          {t('yourRooms')}
        </h2>
        <Link href="/rooms" className="text-[13px] font-medium text-accent-text hover:underline">
          {t('allRooms')}
        </Link>
      </div>
      <ul className="card divide-y divide-line overflow-hidden">
        {joined.map((room) => (
          <li key={room.id}>
            <Link
              href={`/rooms/${room.slug}`}
              className="flex items-center gap-3 px-3.5 py-2.5 outline-none state-toggle hover:bg-paper-raised/60 focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)]"
            >
              <RoomInitial name={room.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[0.875rem] font-medium">{room.name}</span>
                <span className="block truncate text-[12px] text-ink-tertiary">
                  {room.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
