import * as webPush from 'web-push';

import type { Env } from '../env.js';
import type { Logger } from 'pino';

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Payloads never contain numbers or names; see product principle 5. */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface PushSender {
  readonly enabled: boolean;
  send(target: PushTarget, payload: PushPayload): Promise<'sent' | 'gone' | 'failed'>;
}

export function createPushSender(env: Env, logger: Logger): PushSender {
  const enabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
  if (enabled) {
    webPush.setVapidDetails(
      env.VAPID_SUBJECT ?? '',
      env.VAPID_PUBLIC_KEY ?? '',
      env.VAPID_PRIVATE_KEY ?? '',
    );
  }

  return {
    enabled,
    async send(target, payload) {
      if (!enabled) return 'failed';
      try {
        await webPush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: 'low' },
        );
        return 'sent';
      } catch (error) {
        if (
          error instanceof WebPushError &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          return 'gone';
        }
        logger.warn({ err: error }, 'push delivery failed');
        return 'failed';
      }
    },
  };
}
