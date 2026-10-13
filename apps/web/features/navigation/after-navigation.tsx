'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface Pending {
  /** Navigate here once the current navigation has committed. */
  href: string | null;
  /** Refresh the destination once it is on screen. */
  refresh: boolean;
}

let pending: Pending | null = null;

/**
 * Overlays that changed data (publish, burn, save) first leave the overlay and
 * only then navigate to where the result lives and refresh it. Doing both in
 * one step from inside an intercepted route makes the client router decode a
 * server tree without a page segment (Next 16.4), so the steps are serialised
 * on navigation commits instead.
 */
export function requestAfterNavigation(next: { href?: string }): void {
  pending = { href: next.href ?? null, refresh: true };
}

export function AfterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    if (!pending) return;
    if (pending.href && pending.href !== key) {
      const href = pending.href;
      pending = { href: null, refresh: true };
      router.replace(href);
      return;
    }
    pending = null;
    router.refresh();
  }, [key, router]);

  return null;
}
