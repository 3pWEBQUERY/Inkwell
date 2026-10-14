import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons on the right; they wrap below the title on narrow screens. */
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Every app page opens the same way: serif title, one quiet line, actions aligned to the title. */
export function PageHeader({ title, description, actions, className, children }: PageHeaderProps) {
  return (
    <header className={cn('mb-8 md:mb-10', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="display text-[2rem] md:text-[2.375rem]">{title}</h1>
          {description ? (
            <p className="mt-2 text-[0.9375rem] text-pretty text-ink-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

/** A labelled group of content inside a page. */
export function Section({
  id,
  label,
  action,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn('mt-10 first-of-type:mt-0', className)}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id={id} className="label">
          {label}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
