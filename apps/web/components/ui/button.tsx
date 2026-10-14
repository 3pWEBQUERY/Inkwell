import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover disabled:bg-accent disabled:opacity-45',
  secondary:
    'border border-line-strong bg-surface text-ink hover:border-ink-tertiary/60 hover:bg-paper-raised disabled:opacity-45',
  ghost: 'text-ink hover:bg-paper-raised disabled:opacity-45',
  danger: 'bg-warn text-accent-ink hover:brightness-95 disabled:opacity-45',
  link: 'text-accent-text underline-offset-4 hover:underline disabled:opacity-45 px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.875rem]',
  md: 'h-10 px-4 text-[0.9375rem] pointer-coarse:h-11',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    busy = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-[-0.005em] whitespace-nowrap select-none state-toggle',
        'active:translate-y-px disabled:active:translate-y-0',
        VARIANTS[variant],
        variant === 'link' ? '' : SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
