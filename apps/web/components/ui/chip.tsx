'use client';

import { cn } from '@/lib/cn';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full border px-3.5 text-[0.875rem] font-medium whitespace-nowrap state-toggle pointer-coarse:h-10',
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-line-strong bg-surface text-ink-secondary hover:border-ink-tertiary/60 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
