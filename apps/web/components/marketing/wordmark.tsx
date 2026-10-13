import { cn } from '@/lib/cn';

/** The wordmark is set in the serif, lowercase, with a single ink dot. */
export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        'font-serif tracking-tight text-ink',
        compact ? 'text-lg' : 'text-xl',
        className,
      )}
      aria-label="Inkwell"
    >
      inkwell<span className="text-accent">.</span>
    </span>
  );
}
