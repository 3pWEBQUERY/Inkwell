'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

const DURATIONS = [5, 10, 15, 25] as const;

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

/**
 * An optional, quiet writing timer. No sound, no score, nothing stored: when
 * the time is up it says so once and the writing simply goes on.
 */
export function WritingTimer() {
  const t = useTranslations('editor.timer');
  const { announce } = useAnnouncer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [requested, setRequested] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // The clock starts here rather than in the click handler, which keeps rendering pure.
  useEffect(() => {
    if (requested === null) return;
    setEndsAt(Date.now() + requested * 60_000);
    setRequested(null);
  }, [requested]);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) {
        setEndsAt(null);
        setDone(true);
        announce(t('done'));
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [endsAt, announce, t]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && root.current?.contains(event.target as Node)) return;
      if (event instanceof KeyboardEvent) {
        // Escape closes this menu only, not the editor underneath.
        event.preventDefault();
        event.stopPropagation();
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close, true);
    };
  }, [menuOpen]);

  const start = (minutes: number) => {
    setDone(false);
    setMenuOpen(false);
    setRequested(minutes);
    announce(t('started', { minutes }));
  };

  const running = endsAt !== null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          if (running) {
            setEndsAt(null);
            announce(t('stopped'));
          } else {
            setDone(false);
            setMenuOpen((open) => !open);
          }
        }}
        aria-label={running ? t('stop') : t('label')}
        aria-expanded={running ? undefined : menuOpen}
        title={running ? t('stop') : t('label')}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md px-2 text-[0.875rem] font-medium state-toggle pointer-coarse:h-11',
          running
            ? 'bg-paper-sunken text-ink tabular-nums hover:bg-paper-raised'
            : done
              ? 'text-accent-text hover:bg-paper-raised'
              : 'text-ink-secondary hover:bg-paper-raised hover:text-ink',
        )}
      >
        <Icon name="timer" size={17} />
        {running ? <span>{clock(endsAt - now)}</span> : null}
        {done && !running ? <span>{t('doneShort')}</span> : null}
      </button>
      {menuOpen ? (
        <div className="float absolute top-full left-0 z-30 mt-1.5 w-56 rounded-lg p-1.5">
          <p className="px-2.5 pt-1.5 pb-2 text-[13px] leading-snug text-ink-secondary">
            {t('intro')}
          </p>
          <ul className="grid grid-cols-2 gap-1">
            {DURATIONS.map((minutes) => (
              <li key={minutes}>
                <button
                  type="button"
                  onClick={() => start(minutes)}
                  className="h-9 w-full rounded-md text-[0.875rem] font-medium state-toggle hover:bg-paper-raised pointer-coarse:h-11"
                >
                  {t('minutes', { minutes })}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
