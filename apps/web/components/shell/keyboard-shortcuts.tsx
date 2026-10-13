'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';

/** Desktop shortcuts: N new text, / search the journal, J/K move in lists. Escape is handled by the overlays. */
export function KeyboardShortcuts({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'n' && signedIn) {
        event.preventDefault();
        router.push('/write');
      } else if (event.key === '/' && signedIn) {
        event.preventDefault();
        router.push('/journal?focus=search');
      } else if (event.key === 'j' || event.key === 'k') {
        const items = Array.from(document.querySelectorAll<HTMLElement>('[data-list-item]'));
        if (items.length === 0) return;
        event.preventDefault();
        const index = items.findIndex(
          (item) => item === document.activeElement || item.contains(document.activeElement),
        );
        const next =
          event.key === 'j' ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
        items[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, signedIn]);
  return null;
}
