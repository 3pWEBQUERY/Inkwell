'use client';

import { useEffect, useRef } from 'react';

import { useMe } from '@/components/providers/session-provider';
import { markRead } from '@/features/posts/actions';
import { db } from '@/lib/db';

/** Remembers reading progress locally and sends one idempotent `read` at 80 % scroll depth. */
export function ReadTracker({ postId, isAuthor }: { postId: string; isAuthor: boolean }) {
  const me = useMe();
  const sent = useRef(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        const ratio = total <= 0 ? 1 : Math.min(1, window.scrollY / total);
        void db().readProgress.put({ postId, ratio, updatedAt: Date.now() });
        if (ratio >= 0.8 && !sent.current && me && !isAuthor) {
          sent.current = true;
          void markRead(postId);
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [postId, me, isAuthor]);

  return null;
}
