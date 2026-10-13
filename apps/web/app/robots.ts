import { publicEnv } from '@/env';

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/imprint', '/terms', '/changelog', '/press'],
        disallow: ['/today', '/journal', '/me', '/write', '/admin', '/api'],
      },
    ],
    sitemap: `${publicEnv.appOrigin}/sitemap.xml`,
  };
}
