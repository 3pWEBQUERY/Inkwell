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
        'h-9 rounded-full border px-3.5 text-sm whitespace-nowrap state-toggle',
        active
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-line-strong text-ink-secondary hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
