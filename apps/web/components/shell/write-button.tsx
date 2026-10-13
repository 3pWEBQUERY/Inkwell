'use client';

import { useRef } from 'react';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

interface WriteButtonProps {
  label: string;
  compact?: boolean;
  signedIn: boolean;
}

/**
 * Opens the editor overlay. Records its own position so the overlay can scale
 * out of the button (PRD 8.1). Guests are sent to sign-in instead.
 */
export function WriteButton({ label, compact = false, signedIn }: WriteButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const remember = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    document.documentElement.style.setProperty(
      '--write-origin-x',
      `${rect.left + rect.width / 2}px`,
    );
    document.documentElement.style.setProperty(
      '--write-origin-y',
      `${rect.top + rect.height / 2}px`,
    );
  };
  return (
    <Link
      ref={ref}
      href={signedIn ? '/write' : '/sign-in?intent=create'}
      onClick={remember}
      aria-label={label}
      data-testid="write-button"
      className={cn(
        'inline-flex items-center justify-center gap-2 bg-accent font-medium text-accent-ink state-toggle hover:opacity-90',
        compact ? 'h-12 w-12 rounded-full' : 'h-11 w-full rounded-md px-4',
      )}
    >
      <Icon name="pen" size={compact ? 22 : 18} />
      {compact ? null : label}
    </Link>
  );
}
