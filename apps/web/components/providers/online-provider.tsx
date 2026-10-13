'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { flushQueue } from '@/features/offline/queue';

const OnlineContext = createContext(true);

/** Tracks connectivity and flushes the publish queue whenever the browser comes back online. */
export function OnlineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => {
      setOnline(true);
      void flushQueue();
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'sync-queue') void flushQueue();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    if (navigator.onLine) void flushQueue();
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  return <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>;
}

export function useOnline(): boolean {
  return useContext(OnlineContext);
}
