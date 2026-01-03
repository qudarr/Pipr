"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (_theme: Theme) => void;
  resolved: 'light' | 'dark';
}>({
  theme: 'system',
  setTheme: () => undefined,
  resolved: 'light'
});

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const resolved = useMemo(() => (theme === 'system' ? getSystemTheme() : theme), [theme]);

  useEffect(() => {
    const stored = window.localStorage.getItem('pipr:theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    window.localStorage.setItem('pipr:theme', theme);
  }, [resolved, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
