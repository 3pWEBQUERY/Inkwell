import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNav } from '@/components/marketing/nav';
import { getMe } from '@/features/auth/session';

import type { ReactNode } from 'react';

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  return (
    <>
      <MarketingNav signedIn={Boolean(me)} />
      <main id="content" className="vt-page">
        {children}
      </main>
      <MarketingFooter />
    </>
  );
}
