'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Icon } from '@/components/ui/icon';
import { db } from '@/lib/db';

const MIN_CHARS = 3;
const MAX_CHARS = 600;

interface KeepLineProps {
  postId: string;
  /** The element holding the text; only selections inside it count. */
  bodyId: string;
  source: string;
  roomName: string;
  author: string | null;
}

interface Selected {
  text: string;
  top: number;
  left: number;
}

/**
 * Select a passage while reading and keep it. The line is stored in this
 * browser only; nobody, the author included, learns that it was kept.
 */
export function KeepLine({ postId, bodyId, source, roomName, author }: KeepLineProps) {
  const t = useTranslations('reading.keepLine');
  const me = useMe();
  const { announce } = useAnnouncer();
  const [selected, setSelected] = useState<Selected | null>(null);

  useEffect(() => {
    if (!me) return;
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const selection = document.getSelection();
        const body = document.getElementById(bodyId);
        if (!selection || selection.isCollapsed || !body || selection.rangeCount === 0) {
          setSelected(null);
          return;
        }
        const range = selection.getRangeAt(0);
        if (!body.contains(range.commonAncestorContainer)) {
          setSelected(null);
          return;
        }
        const text = selection.toString().replace(/\s+/g, ' ').trim();
        if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
          setSelected(null);
          return;
        }
        const rect = range.getBoundingClientRect();
        // Below the selection, so the browser's own selection menu above it stays free.
        setSelected({
          text,
          top: rect.bottom + 10,
          left: Math.min(Math.max(rect.left + rect.width / 2, 96), window.innerWidth - 96),
        });
      });
    };
    const clear = () => setSelected(null);
    document.addEventListener('selectionchange', read);
    window.addEventListener('scroll', clear, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('selectionchange', read);
      window.removeEventListener('scroll', clear);
    };
  }, [bodyId, me]);

  if (!selected) return null;

  const keep = async () => {
    await db().passages.put({
      id: globalThis.crypto.randomUUID(),
      postId,
      text: selected.text,
      source,
      roomName,
      author,
      createdAt: Date.now(),
    });
    document.getSelection()?.removeAllRanges();
    setSelected(null);
    announce(t('kept'));
  };

  return (
    <button
      type="button"
      // Keep the selection alive until the click lands.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => void keep()}
      style={{ top: selected.top, left: selected.left }}
      className="float fixed z-40 inline-flex h-9 -translate-x-1/2 items-center gap-2 rounded-lg px-3 text-[0.875rem] font-medium state-toggle hover:bg-paper-raised pointer-coarse:h-11"
    >
      <Icon name="quote" size={15} className="text-accent-text" />
      {t('keep')}
    </button>
  );
}
