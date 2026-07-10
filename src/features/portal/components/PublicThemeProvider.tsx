'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { updatePublicTheme } from '../actions/theme-actions';

type Theme = 'light' | 'dark';

interface ThemeContextData {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

export function PublicThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync to local storage for immediate client restoration if needed
  useEffect(() => {
    localStorage.setItem('public-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Rate Limiting (Debounce de 2 segundos) para o servidor
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      updatePublicTheme(newTheme).catch(console.error);
    }, 2000);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('usePublicTheme must be used within a PublicThemeProvider');
  }
  return context;
}
