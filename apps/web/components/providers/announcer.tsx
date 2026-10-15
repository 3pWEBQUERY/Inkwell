'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface Announcement {
  id: number;
  text: string;
}

interface AnnouncerValue {
  /** Shows a short, calm message at the bottom and announces it to screen readers. */
  announce: (text: string) => void;
}

const AnnouncerContext = createContext<AnnouncerValue | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const counter = useRef(0);

  const announce = useCallback((text: string) => {
    const id = (counter.current += 1);
    setItems((current) => [...current.slice(-2), { id, text }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--height-tabbar)+96px)] z-50 flex flex-col items-center gap-2 px-4 md:bottom-28"
      >
        {items.map((item) => (
          <div key={item.id} className="float rounded-lg px-4 py-2.5 text-sm text-ink">
            {item.text}
          </div>
        ))}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): AnnouncerValue {
  const context = useContext(AnnouncerContext);
  if (!context) throw new Error('useAnnouncer outside AnnouncerProvider');
  return context;
}
