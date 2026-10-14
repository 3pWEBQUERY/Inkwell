'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './icon';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** `panel`: centred card. `sheet`: slides from the bottom on phones, from the right on desktop. `full`: the whole viewport (editor). */
  kind?: 'panel' | 'sheet' | 'full';
  closeLabel: string;
  children: ReactNode;
  /** Ask before closing (editor with content). Return false to keep the overlay open. */
  beforeClose?: () => boolean;
  width?: number;
  hideClose?: boolean;
}

/**
 * Every overlay is a native <dialog>: focus trap and Escape come from the
 * platform, focus returns to the opener, the backdrop dims to 40 %.
 */
export function Overlay({
  open,
  onClose,
  title,
  kind = 'panel',
  closeLabel,
  children,
  beforeClose,
  width = 440,
  hideClose,
}: OverlayProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const finishClose = useCallback(() => {
    const dialog = ref.current;
    if (!dialog) return;
    setClosing(true);
    const duration = parseMotion('--motion-overlay-close');
    window.setTimeout(() => {
      dialog.close();
      setClosing(false);
      opener.current?.focus();
      onClose();
    }, duration);
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (beforeClose && !beforeClose()) return;
    finishClose();
  }, [beforeClose, finishClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [requestClose]);

  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current && kind !== 'full') requestClose();
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click only; Escape is handled by the platform
    <dialog
      ref={ref}
      aria-label={title}
      data-kind={kind}
      onClick={onBackdropClick}
      className={cn(
        'overlay m-auto text-ink',
        closing && 'closing',
        kind === 'panel' && 'float w-[calc(100%-32px)] rounded-xl p-6',
        kind === 'sheet' &&
          'sheet float fixed inset-x-0 bottom-0 mb-0 w-full max-h-[90dvh] rounded-t-xl border-b-0 p-6 md:inset-auto md:top-2 md:right-2 md:bottom-2 md:h-[calc(100dvh-16px)] md:max-h-none md:w-[420px] md:rounded-xl md:border-b',
        kind === 'full' &&
          'fixed inset-0 h-dvh max-h-none w-full max-w-none rounded-none border-0 bg-paper p-0',
      )}
      style={kind === 'panel' ? { maxWidth: width } : undefined}
    >
      {title && kind !== 'full' ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-medium tracking-[-0.01em]">{title}</h2>
          {!hideClose ? (
            <button
              type="button"
              onClick={requestClose}
              aria-label={closeLabel}
              className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Icon name="close" />
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </dialog>
  );
}

function parseMotion(variable: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return 160;
  return raw.endsWith('ms') ? value : value * 1000;
}
