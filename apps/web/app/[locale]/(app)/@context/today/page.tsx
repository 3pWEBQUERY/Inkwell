import { YourRooms } from '@/components/rooms/your-rooms';
import { ShortcutList } from '@/components/shell/shortcut-list';
import { getMe } from '@/features/auth/session';
import { getRooms } from '@/features/posts/queries';

/** Today's context column: quick links to joined rooms and the keyboard shortcuts. */
export default async function TodayContext() {
  const me = await getMe();
  if (!me) return null;
  const rooms = await getRooms(me.roomLocales).catch(() => []);
  return (
    <div className="sticky top-12">
      <YourRooms rooms={rooms} />
      <ShortcutList />
    </div>
  );
}
