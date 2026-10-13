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

export type Theme = 'light' | 'dark' | 'system';
export type MotionPreference = 'system' | 'reduce';

interface ThemeContextValue {
  theme: Theme;
  motion: MotionPreference;
  setTheme: (theme: Theme) => void;
  setMotion: (motion: MotionPreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'inkwell.theme';
const MOTION_KEY = 'inkwell.motion';

/** Inline script for <head>: applies the stored theme before first paint, so there is no flash. Receives the CSP nonce. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}var m=localStorage.getItem('${MOTION_KEY}');if(m==='reduce'){document.documentElement.setAttribute('data-motion','reduce')}}catch(e){}})();`;

function apply(theme: Theme, motion: MotionPreference) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (motion === 'reduce') root.setAttribute('data-motion', 'reduce');
  else root.removeAttribute('data-motion');
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
  initialMotion = 'system',
}: {
  children: ReactNode;
  initialTheme?: Theme;
  initialMotion?: MotionPreference;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [motion, setMotionState] = useState<MotionPreference>(initialMotion);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
      const storedMotion = localStorage.getItem(MOTION_KEY) as MotionPreference | null;
      if (storedTheme) setThemeState(storedTheme);
      if (storedMotion) setMotionState(storedMotion);
    } catch {
      // Storage may be unavailable (private mode); the system preference applies.
    }
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // ignore
      }
      // Theme changes cross-fade the whole page (PRD 13) where the browser supports it.
      const root = document.documentElement;
      const run = () => apply(next, motion);
      if ('startViewTransition' in document) {
        root.setAttribute('data-theme-switching', '');
        const transition = document.startViewTransition(run);
        void transition.finished.finally(() => root.removeAttribute('data-theme-switching'));
      } else {
        run();
      }
    },
    [motion],
  );

  const setMotion = useCallback(
    (next: MotionPreference) => {
      setMotionState(next);
      try {
        localStorage.setItem(MOTION_KEY, next);
      } catch {
        // ignore
      }
      apply(theme, next);
    },
    [theme],
  );

  const value = useMemo(
    () => ({ theme, motion, setTheme, setMotion }),
    [theme, motion, setTheme, setMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme outside ThemeProvider');
  return context;
}
