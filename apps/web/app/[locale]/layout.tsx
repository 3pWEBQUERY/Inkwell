import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { AnnouncerProvider } from '@/components/providers/announcer';
import { CryptoProvider } from '@/components/providers/crypto-provider';
import { OnlineProvider } from '@/components/providers/online-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/providers/theme-provider';
import { ServiceWorkerRegistration } from '@/components/shell/service-worker';
import { publicEnv } from '@/env';
import { getMe } from '@/features/auth/session';
import { routing } from '@/i18n/routing';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@/styles/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    metadataBase: new URL(publicEnv.appOrigin),
    title: { default: t('appName'), template: `%s · ${t('appName')}` },
    description: t('tagline'),
    applicationName: t('appName'),
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: t('appName') },
    icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === routing.defaultLocale ? '/' : `/${l}`]),
      ),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1014' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const me = await getMe();
  const theme = me?.settings.theme ?? 'system';
  const motion = me?.settings.reduceMotion ?? 'system';

  return (
    <html
      lang={locale}
      data-theme={theme === 'system' ? undefined : theme}
      data-motion={motion === 'reduce' ? 'reduce' : undefined}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <ThemeProvider initialTheme={theme} initialMotion={motion}>
            <AnnouncerProvider>
              <SessionProvider me={me}>
                <CryptoProvider>
                  <OnlineProvider>
                    {children}
                    <ServiceWorkerRegistration />
                  </OnlineProvider>
                </CryptoProvider>
              </SessionProvider>
            </AnnouncerProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
