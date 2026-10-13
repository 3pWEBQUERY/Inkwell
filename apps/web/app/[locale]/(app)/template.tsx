import type { ReactNode } from 'react';

/** Re-mounts on every navigation, which replays the enter animation where View Transitions are unavailable. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
