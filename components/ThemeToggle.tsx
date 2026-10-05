'use client';

import { useEffect, useState, useCallback } from 'react';

const KEY = 'dogeow-tutorial-theme';

function readInitialTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null);

  useEffect(() => {
    setTheme(readInitialTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = (prev ?? readInitialTheme()) === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Private mode and full storage can reject the write. The class still updates.
      }
      return next;
    });
  }, []);

  const label = theme === 'dark' ? '切换到浅色' : theme === 'light' ? '切换到深色' : '切换主题';

  return (
    <button className="theme-toggle" onClick={toggle} title={label} aria-label={label}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
