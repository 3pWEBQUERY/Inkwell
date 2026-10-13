import { NextResponse } from 'next/server';

import { publicEnv, serverEnv } from '@/env';

export const dynamic = 'force-dynamic';

/** Liveness for Railway plus a reachability probe of the API for the status page. */
export async function GET() {
  const env = serverEnv();
  let apiStatus: 'ok' | 'degraded' = 'degraded';
  try {
    const response = await fetch(`${env.API_URL}/health/ready`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    apiStatus = response.ok ? 'ok' : 'degraded';
  } catch {
    apiStatus = 'degraded';
  }
  return NextResponse.json(
    { status: 'ok', api: apiStatus, version: publicEnv.appVersion, build: publicEnv.buildId },
    { headers: { 'cache-control': 'no-store' } },
  );
}
