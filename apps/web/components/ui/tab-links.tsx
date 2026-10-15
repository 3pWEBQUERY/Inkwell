import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

interface TabLink {
  href: string;
  label: string;
  active: boolean;
}

/** Two or three views of one page as links: the server renders the chosen one, the URL stays shareable. */
export function TabLinks({ label, tabs }: { label: string; tabs: TabLink[] }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-[12px] bg-paper-sunken p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? 'page' : undefined}
          className={cn(
            'inline-flex h-8 items-center rounded-[9px] border px-3.5 text-[0.875rem] font-medium state-toggle pointer-coarse:h-10',
            tab.active
              ? 'border-line bg-surface text-ink'
              : 'border-transparent text-ink-secondary hover:text-ink',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
