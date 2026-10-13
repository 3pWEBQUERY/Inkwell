'use client';

import { savePushSubscription } from '../posts/actions';

/**
 * Asks for permission only at this moment, with the explanation shown next to
 * the bell (PRD 6.6: never during onboarding). Returns why it did not work.
 */
export async function subscribeToPush(
  vapidPublicKey: string | null,
): Promise<'subscribed' | 'denied' | 'unsupported'> {
  if (
    !vapidPublicKey ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  )
    return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));
  const json = subscription.toJSON();
  const result = await savePushSubscription({ endpoint: json.endpoint, keys: json.keys });
  return result.ok ? 'subscribed' : 'unsupported';
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}
