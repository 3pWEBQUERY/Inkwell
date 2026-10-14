'use client';

import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-start justify-between gap-6 py-3', disabled && 'opacity-50')}>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-[13px] leading-snug text-ink-secondary">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-10 shrink-0 rounded-full state-toggle',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0 h-5 w-5 rounded-full bg-surface transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
          style={{ transitionDuration: 'var(--motion-fast)' }}
        />
      </button>
    </label>
  );
}
