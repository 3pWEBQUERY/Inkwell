import { cn } from '@/lib/cn';

/** A room's first letter in the serif on an ink tint: rooms look different without invented icons. */
export function RoomInitial({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-accent-tint font-serif leading-none font-medium text-accent-text',
        size === 'sm'
          ? 'h-8 w-8 rounded-[8px] text-[1rem]'
          : 'h-10 w-10 rounded-[10px] text-[1.25rem]',
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
