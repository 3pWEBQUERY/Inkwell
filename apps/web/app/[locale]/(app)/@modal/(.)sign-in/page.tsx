import { AuthOverlay } from '@/components/auth/auth-overlay';

/** Joining, reacting or writing as a guest opens the auth panel over the current page. */
export default async function InterceptedSignInInApp({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  return (
    <AuthOverlay
      intent={intent === 'create' ? 'create' : 'sign-in'}
      appleClientId={process.env.NEXT_PUBLIC_APPLE_CLIENT_ID}
    />
  );
}
