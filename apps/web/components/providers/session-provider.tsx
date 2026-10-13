'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Me } from '@inkwell/shared';

const SessionContext = createContext<Me | null>(null);

export function SessionProvider({ me, children }: { me: Me | null; children: ReactNode }) {
  return <SessionContext.Provider value={me}>{children}</SessionContext.Provider>;
}

/** The signed-in person as rendered by the server, or null for guests. */
export function useMe(): Me | null {
  return useContext(SessionContext);
}
