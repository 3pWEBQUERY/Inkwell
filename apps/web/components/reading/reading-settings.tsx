'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useMe } from '@/components/providers/session-provider';
import { Icon } from '@/components/ui/icon';
import { updateMe } from '@/features/posts/actions';
import { cn } from '@/lib/cn';

const MIN_SIZE = 17;
const MAX_SIZE = 22;
const SAVE_AFTER_MS = 600;

interface ReadingSettingsProps {
  /** The element whose type changes right away. */
  bodyId: string;
  fontSize: number;
  font: 'serif' | 'sans';
}

/**
 * Size and typeface for reading, at hand where the text is. Changes apply at
 * once and are saved as the account's reading and writing preference.
 */
export function ReadingSettings({ bodyId, fontSize, font }: ReadingSettingsProps) {
  const t = useTranslations('reading.settings');
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(fontSize);
  const [face, setFace] = useState(font);
  const root = useRef<HTMLDivElement>(null);
  const changed = useRef(false);

  useEffect(() => {
    const body = document.getElementById(bodyId);
    if (!body) return;
    body.style.fontSize = `${String(size)}px`;
    body.classList.toggle('sans', face === 'sans');
    if (!changed.current || !me) return;
    const timer = window.setTimeout(() => {
      void updateMe({ settings: { fontSize: size, editorFont: face } });
    }, SAVE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [bodyId, size, face, me]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && root.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const change = (next: { size?: number; face?: 'serif' | 'sans' }) => {
    changed.current = true;
    if (next.size !== undefined) setSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, next.size)));
    if (next.face) setFace(next.face);
  };

  const step =
    'flex h-9 w-9 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent pointer-coarse:h-11 pointer-coarse:w-11';

  return (
    // The panel aligns with the header's right edge (its positioned parent), so it never leaves a phone screen.
    <div ref={root}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={t('label')}
        title={t('label')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md font-serif text-[1rem] text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
      >
        Aa
      </button>
      {open ? (
        <div className="float absolute top-full right-0 z-30 mt-1.5 w-64 rounded-lg p-3">
          <p className="label mb-2">{t('size')}</p>
          <div className="flex items-center justify-between rounded-md bg-paper-sunken p-1">
            <button
              type="button"
              onClick={() => change({ size: size - 1 })}
              disabled={size <= MIN_SIZE}
              aria-label={t('smaller')}
              className={step}
            >
              <span className="font-serif text-[0.875rem]">A</span>
            </button>
            <span className="text-[0.875rem] font-medium tabular-nums">{size} px</span>
            <button
              type="button"
              onClick={() => change({ size: size + 1 })}
              disabled={size >= MAX_SIZE}
              aria-label={t('larger')}
              className={step}
            >
              <span className="font-serif text-[1.125rem]">A</span>
            </button>
          </div>
          <p className="label mt-4 mb-2">{t('face')}</p>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-paper-sunken p-1">
            {(['serif', 'sans'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={face === option}
                onClick={() => change({ face: option })}
                className={cn(
                  'h-9 rounded-[7px] border text-[0.875rem] font-medium state-toggle pointer-coarse:h-11',
                  option === 'serif' ? 'font-serif' : 'font-sans',
                  face === option
                    ? 'border-line bg-surface text-ink'
                    : 'border-transparent text-ink-secondary hover:text-ink',
                )}
              >
                {t(option)}
              </button>
            ))}
          </div>
          {me ? null : (
            <p className="mt-3 flex items-start gap-1.5 text-[12px] text-ink-tertiary">
              <Icon name="lock" size={12} className="mt-0.5 shrink-0" />
              {t('guest')}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
