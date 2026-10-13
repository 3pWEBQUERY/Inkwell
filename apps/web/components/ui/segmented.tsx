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

/** A segmented control; the underline slides to the active option. */
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
    <div role="tablist" aria-label={label} className="relative flex border-b border-line">
      {options.map((option) => (
        <button
          key={option.value}
          id={`${id}-${option.value}`}
          role="tab"
          type="button"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 py-2.5 text-center state-toggle min-h-11',
            option.value === value ? 'text-ink font-medium' : 'text-ink-secondary hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
      <span
        aria-hidden
        className="absolute bottom-[-1px] h-0.5 bg-accent transition-transform"
        style={{
          width: `${100 / options.length}%`,
          transform: `translateX(${index * 100}%)`,
          transitionDuration: 'var(--motion-base)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      />
    </div>
  );
}
