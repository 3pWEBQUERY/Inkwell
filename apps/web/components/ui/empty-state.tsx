import type { ReactNode } from 'react';

/** Calm empty states: one sentence, optionally one action. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 py-10 text-ink-secondary">
      <p className="font-serif text-lg text-ink">{children}</p>
      {action}
    </div>
  );
}
