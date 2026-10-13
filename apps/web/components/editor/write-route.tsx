'use client';

import { useRouter } from 'next/navigation';

import { canGoBackInApp } from '@/features/navigation/close-overlay';

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
  intercepted: boolean;
}

/** Cancelling goes back to the page underneath when there is one; the first entry after onboarding and direct visits go to /today. */
export function WriteRoute({ intercepted, ...rest }: WriteRouteProps) {
  const router = useRouter();
  return (
    <WriteOverlay
      {...rest}
      intercepted={intercepted && !rest.first}
      onClose={() =>
        intercepted && !rest.first && canGoBackInApp() ? router.back() : router.replace('/today')
      }
    />
  );
}
