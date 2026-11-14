import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Storage from 'expo-sqlite/kv-store';
import { createShadows, darkColors, lightColors } from './theme';

const STORAGE_KEY = 'fixit.themePreference';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedMode = await Storage.getItem(STORAGE_KEY);
        if (active && (savedMode === 'light' || savedMode === 'dark')) setMode(savedMode);
      } catch {
        // Keep the light default if local preference storage is unavailable.
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const setTheme = useCallback((nextMode) => {
    if (nextMode !== 'light' && nextMode !== 'dark') return;
    setMode(nextMode);
    Promise.resolve().then(() => Storage.setItem(STORAGE_KEY, nextMode)).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'light' ? 'dark' : 'light');
  }, [mode, setTheme]);

  const value = useMemo(() => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    return { mode, colors, shadows: createShadows(colors), ready, setTheme, toggleTheme };
  }, [mode, ready, setTheme, toggleTheme]);

  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
