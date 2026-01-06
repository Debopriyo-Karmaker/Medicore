// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'medicore_theme'; // 'light' | 'dark'

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // default

  // Apply theme class to <html> (or <body>) for global CSS theming
  const applyThemeClass = (nextTheme) => {
    const root = document.documentElement; // <html>
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(nextTheme === 'dark' ? 'theme-dark' : 'theme-light');
  };

  // Load initial theme from localStorage or prefers-color-scheme
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      let initial = 'light';

      if (stored === 'light' || stored === 'dark') {
        initial = stored;
      } else {
        // Fallback: system preference
        const prefersDark = window.matchMedia?.(
          '(prefers-color-scheme: dark)'
        ).matches;
        initial = prefersDark ? 'dark' : 'light';
      }

      setTheme(initial);
      applyThemeClass(initial);
    } catch {
      // Fallback safely to light if anything goes wrong
      setTheme('light');
      applyThemeClass('light');
    }
  }, []);

  // Persist to localStorage and update DOM class whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
