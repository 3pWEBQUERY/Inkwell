'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { cryptoClient } from '@/features/crypto/client';

interface CryptoState {
  /** null while unknown, then whether this device holds the master key. */
  hasKey: boolean | null;
  refresh: () => Promise<void>;
}

const CryptoContext = createContext<CryptoState | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHasKey(await cryptoClient.hasKey());
    } catch {
      setHasKey(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ hasKey, refresh }), [hasKey, refresh]);
  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCryptoState(): CryptoState {
  const context = useContext(CryptoContext);
  if (!context) throw new Error('useCryptoState outside CryptoProvider');
  return context;
}
