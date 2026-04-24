// frontend/src/themes/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('dsa-theme') || 'dark'
  );

  useEffect(() => {
    localStorage.setItem('dsa-theme', theme);
    // Keep 'mario' as the data-theme value for CSS compatibility
    // but expose it as 'light' to users
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'mario' : 'dark');
    document.body.className = theme === 'light' ? 'theme-mario' : '';
  }, [theme]);

  function toggle() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggle,
      isMario: theme === 'light',   // internal alias — CSS still uses mario
      isLight: theme === 'light',
      isDark:  theme === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};