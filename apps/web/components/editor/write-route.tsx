'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { canGoBackInApp, leaveFullPageEditor } from '@/features/navigation/close-overlay';
import { getPathname } from '@/i18n/navigation';

import { WriteOverlay } from './write-overlay';

import type { OwnSeries, RoomView } from '@/features/posts/queries';
import type { FeedPost, UserSettings } from '@inkwell/shared';

interface WriteRouteProps {
  rooms: RoomView[];
  series: OwnSeries[];
  settings: UserSettings;
  first: boolean;
  editPost: FeedPost | null;
  editPrivateId: string | null;
  promptIndex: number | null;
  roomSlug: string | null;
  draftId: string | null;
  intercepted: boolean;
}

/**
 * Cancelling goes back to the page underneath when there is one. The editor
 * shown as a full page (the first entry after onboarding, or /write opened
 * directly) leaves with a real page load; see leaveFullPageEditor.
 */
export function WriteRoute({ intercepted, ...rest }: WriteRouteProps) {
  const router = useRouter();
  const locale = useLocale();
  const asOverlay = intercepted && !rest.first;
  return (
    <WriteOverlay
      {...rest}
      intercepted={asOverlay}
      fullPage={!asOverlay}
      onClose={() => {
        if (!asOverlay) return leaveFullPageEditor(getPathname({ href: '/today', locale }));
        if (canGoBackInApp()) return router.back();
        router.replace('/today');
      }}
    />
  );
}
