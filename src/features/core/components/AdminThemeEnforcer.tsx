'use client'

import { useLayoutEffect } from 'react';

export function AdminThemeEnforcer() {
  useLayoutEffect(() => {
    // Force dark mode on admin routes immediately on mount
    document.documentElement.classList.add('dark');
    
    // Cleanup if needed? Usually we don't clean up because navigating to public routes 
    // will trigger the public theme provider's effect which sets the correct theme.
    // However, to be safe:
    return () => {
      const publicTheme = localStorage.getItem('public-theme');
      if (publicTheme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  return null;
}
