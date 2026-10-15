'use client';

/**
 * Closing an intercepted overlay should return to the page underneath. When the
 * overlay was the first thing opened in this tab (a direct link, or a
 * `router.replace` right after onboarding) there is nothing to go back to, so
 * the fallback route is used instead of leaving the site.
 */
export function canGoBackInApp(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = (window as Window & { navigation?: { canGoBack?: boolean } }).navigation;
  if (nav && typeof nav.canGoBack === 'boolean') return nav.canGoBack;
  return window.history.length > 1;
}

/**
 * Leaves the full-page editor (first entry after onboarding, or /write opened
 * directly) with a real page load. The App Router keeps that route's tree
 * alive after a client-side replace, and a later link to /write then shows
 * nothing new; a fresh document avoids that state entirely. Only used for
 * that one exit; the overlay over other pages stays a client navigation.
 */
export function leaveFullPageEditor(localizedHref: string): void {
  window.location.replace(localizedHref);
}
