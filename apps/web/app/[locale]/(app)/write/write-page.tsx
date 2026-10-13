import { LOCALES } from '@inkwell/shared';

import { WriteRoute } from '@/components/editor/write-route';
import { getMe } from '@/features/auth/session';
import { getOwnSeries, getPost, getRooms } from '@/features/posts/queries';
import { redirect } from '@/i18n/navigation';

interface WritePageProps {
  locale: string;
  searchParams: { first?: string; edit?: string; editPrivate?: string };
  intercepted: boolean;
}

/** Shared by the full page and the intercepted overlay: loads joined rooms, own series and an optional text to edit. */
export async function WritePage({ locale, searchParams, intercepted }: WritePageProps) {
  const me = await getMe();
  if (!me) {
    redirect({ href: '/sign-in?intent=create', locale });
    return null;
  }
  const [rooms, series, editPost] = await Promise.all([
    getRooms(me.roomLocales.length > 0 ? me.roomLocales : [...LOCALES]),
    getOwnSeries().catch(() => []),
    searchParams.edit ? getPost(searchParams.edit) : Promise.resolve(null),
  ]);
  return (
    <WriteRoute
      rooms={rooms}
      series={series}
      settings={me.settings}
      first={searchParams.first === '1'}
      editPost={editPost?.viewer.isAuthor ? editPost : null}
      editPrivateId={searchParams.editPrivate ?? null}
      intercepted={intercepted}
    />
  );
}
