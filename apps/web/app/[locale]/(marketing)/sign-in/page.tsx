import { getTranslations } from 'next-intl/server';

import { AuthPanel } from '@/components/auth/auth-panel';
import { getMe } from '@/features/auth/session';
import { redirect } from '@/i18n/navigation';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return { title: t('signIn'), robots: { index: false } };
}

/** Direct visits to /sign-in get the same panel as a page of its own. */
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const { locale } = await params;
  const me = await getMe();
  if (me?.pseudonym && !me.pseudonym.startsWith('new.')) redirect({ href: '/today', locale });
  const { intent } = await searchParams;
  return (
    <div className="flex min-h-[calc(100dvh-56px)] items-center px-4 py-16">
      <AuthPanel
        initialIntent={intent === 'create' ? 'create' : 'sign-in'}
        appleClientId={process.env.NEXT_PUBLIC_APPLE_CLIENT_ID}
      />
    </div>
  );
}
