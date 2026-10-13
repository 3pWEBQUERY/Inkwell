import { LOCALES } from '@inkwell/shared';

import { publicEnv } from '@/env';

import type { MetadataRoute } from 'next';

const PAGES = ['', '/privacy', '/imprint', '/terms', '/changelog', '/press', '/status', '/rooms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    const prefix = locale === 'de' ? '' : `/${locale}`;
    for (const page of PAGES) {
      entries.push({
        url: `${publicEnv.appOrigin}${prefix}${page || '/'}`,
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.5,
      });
    }
  }
  return entries;
}
