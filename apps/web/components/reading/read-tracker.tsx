'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useMe } from '@/components/providers/session-provider';
import { Icon } from '@/components/ui/icon';
import { markRead } from '@/features/posts/actions';
import { db } from '@/lib/db';

/** A text counts as begun between these scroll depths. */
export const RESUME_FROM = 0.1;
export const RESUME_UNTIL = 0.9;

interface ReadTrackerProps {
  postId: string;
  isAuthor: boolean;
  title: string | null;
  line: string;
  roomName: string;
}

/**
 * Remembers reading progress locally and sends one idempotent `read` at 80 %
 * scroll depth. Coming back to a text read halfway offers to jump to where the
 * reader stopped; the position never leaves the browser.
 */
export function ReadTracker({ postId, isAuthor, title, line, roomName }: ReadTrackerProps) {
  const t = useTranslations('reading.resume');
  const me = useMe();
  const sent = useRef(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let frame = 0;
    const total = () => document.documentElement.scrollHeight - window.innerHeight;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = total();
        const ratio = height <= 0 ? 1 : Math.min(1, window.scrollY / height);
        if (window.scrollY > 240) setResumeAt(null);
        if (!isAuthor)
          void db().readProgress.put({
            postId,
            ratio,
            updatedAt: Date.now(),
            title,
            line,
            roomName,
          });
        if (ratio >= 0.8 && !sent.current && me && !isAuthor) {
          sent.current = true;
          void markRead(postId);
        }
      });
    };

    void db()
      .readProgress.get(postId)
      .catch(() => undefined)
      .then((previous) => {
        if (!active) return;
        const begun =
          !isAuthor &&
          previous !== undefined &&
          previous.ratio >= RESUME_FROM &&
          previous.ratio < RESUME_UNTIL &&
          window.scrollY < 80 &&
          total() > window.innerHeight;
        // Leave the stored position untouched until the reader scrolls on their own.
        if (begun) setResumeAt(previous.ratio);
        else onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
      });
    return () => {
      active = false;
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [postId, me, isAuthor, title, line, roomName]);

  if (resumeAt === null) return null;

  return (
    <div className="float fixed inset-x-4 bottom-[calc(var(--height-tabbar)+12px)] z-40 mx-auto flex max-w-sm items-center gap-1 rounded-xl p-1.5 md:bottom-6">
      <button
        type="button"
        onClick={() => {
          const height = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: Math.max(0, resumeAt * height - 80), behavior: 'smooth' });
          setResumeAt(null);
        }}
        className="flex h-10 flex-1 items-center gap-2.5 rounded-lg px-3 text-left text-[0.9375rem] font-medium state-toggle hover:bg-paper-raised"
      >
        <Icon name="book-open" size={17} className="text-accent-text" />
        {t('jump')}
      </button>
      <button
        type="button"
        onClick={() => setResumeAt(null)}
        aria-label={t('dismiss')}
        title={t('dismiss')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
