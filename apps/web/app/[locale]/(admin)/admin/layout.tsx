import { notFound } from 'next/navigation';

import { Wordmark } from '@/components/marketing/wordmark';
import { getMe } from '@/features/auth/session';
import { Link } from '@/i18n/navigation';

import type { ReactNode } from 'react';

/** Internal: admin role required (the IP allowlist is enforced in proxy.ts). Not linked from anywhere public. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  if (!me?.roles.includes('admin')) notFound();
  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center justify-between border-b border-line px-4">
        <Link href="/admin">
          <Wordmark compact />
          <span className="ml-2 text-sm text-ink-secondary">admin</span>
        </Link>
        <Link href="/today" className="text-sm text-ink-secondary hover:text-ink">
          {me.pseudonym}
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
