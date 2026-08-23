import { useEffect } from 'react';

// Simplified theme hook: application no longer supports dark mode.
// This forces a single 'light' theme and removes any stored preference or toggling.
export const useTheme = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    // Ensure no 'dark' class remains and set 'light' for consistency.
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const toggleTheme = () => {
    // no-op: dark mode removed
    console.info('Theme toggle disabled: dark mode removed from app.');
  };

  return { theme: 'light', toggleTheme };
};
