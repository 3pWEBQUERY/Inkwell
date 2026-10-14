'use client';

import { useRef } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  describedBy?: string;
  disabled?: boolean;
}

/** Six single-digit fields with auto-advance; pasting a whole code fills all of them. */
export function CodeInput({ value, onChange, label, describedBy, disabled }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const update = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(''));
  };

  return (
    <div role="group" aria-label={label} className="flex justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${label} ${index + 1}`}
          aria-describedby={describedBy}
          className="h-14 w-12 rounded-lg border border-line-strong bg-surface text-center font-serif text-2xl tabular-nums state-toggle focus:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:rounded-lg"
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, '').slice(-1);
            update(index, char);
            if (char && index < 5) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digit && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted.length > 1) {
              event.preventDefault();
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
