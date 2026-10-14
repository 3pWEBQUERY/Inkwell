'use client';

import { useId } from 'react';

import { cn } from '@/lib/cn';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** A segmented control: a track with a thumb that slides to the active option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  const id = useId();
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  return (
    <div
      role="tablist"
      aria-label={label}
      className="relative flex rounded-[12px] bg-paper-sunken p-1"
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-[9px] border border-line bg-surface transition-transform"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
          transitionDuration: 'var(--motion-base)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          id={`${id}-${option.value}`}
          role="tab"
          type="button"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 h-9 flex-1 rounded-[9px] text-center text-[0.9375rem] font-medium state-toggle pointer-coarse:h-10',
            option.value === value ? 'text-ink' : 'text-ink-secondary hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
