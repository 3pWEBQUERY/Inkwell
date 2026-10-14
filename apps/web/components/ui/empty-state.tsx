import type { ReactNode } from 'react';

/** Calm empty states: one sentence, optionally one action. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong px-6 py-8 text-ink-secondary">
      <p className="font-serif text-lg text-ink text-pretty">{children}</p>
      {action}
    </div>
  );
}
