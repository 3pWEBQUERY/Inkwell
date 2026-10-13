import { Faq } from '@/components/marketing/faq';
import {
  ClosingCta,
  Hero,
  HowItWorks,
  InstallAndPricing,
  Promises,
  RoomsPreview,
  Safety,
  Trust,
} from '@/components/marketing/sections';
import { getMe } from '@/features/auth/session';
import { redirect } from '@/i18n/navigation';

/** The landing page. Signed-in people go straight to /today. */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const me = await getMe();
  if (me) redirect({ href: '/today', locale });

  return (
    <>
      <Hero />
      <Promises />
      <HowItWorks />
      <RoomsPreview />
      <Trust />
      <Safety />
      <InstallAndPricing />
      <Faq />
      <ClosingCta />
    </>
  );
}
