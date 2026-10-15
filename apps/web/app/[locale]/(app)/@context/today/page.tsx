import { YourRooms } from '@/components/rooms/your-rooms';
import { ShortcutList } from '@/components/shell/shortcut-list';
import { ContinueReading } from '@/components/today/continue-reading';
import { getMe } from '@/features/auth/session';
import { getRooms } from '@/features/posts/queries';

/** Today's context column: joined rooms, texts begun elsewhere, the keyboard shortcuts. */
export default async function TodayContext() {
  const me = await getMe();
  if (!me) return null;
  const rooms = await getRooms(me.roomLocales).catch(() => []);
  return (
    <div>
      <YourRooms rooms={rooms} />
      <ContinueReading />
      <ShortcutList />
    </div>
  );
}
