import { Suspense, ViewTransition, type ReactNode } from 'react';

import { AppNav } from '@/components/shell/app-nav';
import { InstallHint } from '@/components/shell/install-hint';
import { KeyboardShortcuts } from '@/components/shell/keyboard-shortcuts';
import { OfflineBanner } from '@/components/shell/offline-banner';
import { getMe } from '@/features/auth/session';
import { AfterNavigation } from '@/features/navigation/after-navigation';

/**
 * The persistent shell: navigation and write button render once and stay while
 * only the content area changes. Overlays arrive through the @modal slot; the
 * optional context column (room rules, series info) through @context.
 */
export default async function AppLayout({
  children,
  modal,
  context,
}: {
  children: ReactNode;
  modal: ReactNode;
  context: ReactNode;
}) {
  const me = await getMe();
  const signedIn = Boolean(me);

  return (
    <div className="flex min-h-dvh">
      <AppNav signedIn={signedIn} variant="sidebar" />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <div className="flex flex-1 justify-center gap-10">
          <main
            id="content"
            className="content-width gutter min-w-0 pb-[calc(var(--height-tabbar)+24px)] pt-4 md:pb-16 md:pt-8"
          >
            <ViewTransition name="page">{children}</ViewTransition>
          </main>
          <aside className="hidden w-[280px] shrink-0 pt-8 pr-6 xl:block">{context}</aside>
        </div>
      </div>
      <AppNav signedIn={signedIn} variant="tabbar" />
      {modal}
      <KeyboardShortcuts signedIn={signedIn} />
      <InstallHint />
      <Suspense fallback={null}>
        <AfterNavigation />
      </Suspense>
    </div>
  );
}
