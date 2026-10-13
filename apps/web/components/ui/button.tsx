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
  primary: 'bg-accent text-accent-ink hover:opacity-90 disabled:opacity-50',
  secondary: 'border border-line-strong text-ink hover:bg-paper-raised disabled:opacity-50',
  ghost: 'text-ink hover:bg-paper-raised disabled:opacity-50',
  danger: 'bg-warn text-white hover:opacity-90 disabled:opacity-50',
  link: 'text-accent underline-offset-4 hover:underline disabled:opacity-50 px-0',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4',
  lg: 'h-12 px-6 text-[1.0625rem]',
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
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none state-toggle',
        'min-h-11',
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
