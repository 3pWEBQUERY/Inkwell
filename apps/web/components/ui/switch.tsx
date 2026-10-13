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
    <label className={cn('flex items-start justify-between gap-4 py-2', disabled && 'opacity-50')}>
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-[13px] text-ink-secondary">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full border border-line-strong state-toggle',
          checked ? 'bg-accent' : 'bg-paper-sunken',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5.5 w-5.5 rounded-full bg-paper transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
          style={{ transitionDuration: 'var(--motion-fast)' }}
        />
      </button>
    </label>
  );
}
