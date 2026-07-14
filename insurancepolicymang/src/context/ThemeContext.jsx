import React, { createContext, useEffect, useCallback } from 'react';
import { THEME_KEY } from '../utils/constants';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  }, []);

  const toggleTheme = useCallback(() => {}, []);
  const setTheme = useCallback(() => {}, []);

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
