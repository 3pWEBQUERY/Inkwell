import { AuthOverlay } from '@/components/auth/auth-overlay';

export default async function InterceptedSignIn({
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
