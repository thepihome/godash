import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  ui8: {
    name: 'UI8 Modern',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    navbar: '#1e293b',
  },
  light: {
    name: 'Light',
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    navbar: '#2c3e50',
  },
  dark: {
    name: 'Dark',
    primary: '#0d6efd',
    secondary: '#6c757d',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040',
    navbar: '#1a1a1a',
  },
  blue: {
    name: 'Blue',
    primary: '#0056b3',
    secondary: '#6c757d',
    background: '#f0f4f8',
    surface: '#e1e8ed',
    text: '#1a1a1a',
    textSecondary: '#4a5568',
    border: '#cbd5e0',
    navbar: '#1e3a5f',
  },
  green: {
    name: 'Green',
    primary: '#28a745',
    secondary: '#6c757d',
    background: '#f0f9f4',
    surface: '#e8f5e9',
    text: '#1a1a1a',
    textSecondary: '#4a5568',
    border: '#c8e6c9',
    navbar: '#2e7d32',
  },
  purple: {
    name: 'Purple',
    primary: '#6f42c1',
    secondary: '#6c757d',
    background: '#f5f3ff',
    surface: '#ede9fe',
    text: '#1a1a1a',
    textSecondary: '#4a5568',
    border: '#ddd6fe',
    navbar: '#5b21b6',
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'ui8';
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    const isDarkTheme = currentTheme === 'dark';

    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--secondary-color', theme.secondary);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--surface-color', theme.surface);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--text-secondary-color', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--navbar-color', theme.navbar);

    const mesh = isDarkTheme
      ? `radial-gradient(ellipse 100% 70% at 20% -5%, color-mix(in srgb, ${theme.primary} 35%, transparent) 0%, transparent 55%),
         radial-gradient(ellipse 80% 50% at 100% 100%, color-mix(in srgb, ${theme.secondary} 25%, transparent) 0%, transparent 50%),
         linear-gradient(168deg, ${theme.background} 0%, ${theme.surface} 50%, ${theme.background} 100%)`
      : `radial-gradient(ellipse 110% 65% at -8% -10%, color-mix(in srgb, ${theme.primary} 22%, transparent) 0%, transparent 52%),
         radial-gradient(ellipse 90% 55% at 108% 8%, color-mix(in srgb, ${theme.secondary} 18%, transparent) 0%, transparent 48%),
         linear-gradient(168deg, ${theme.background} 0%, #ffffff 38%, ${theme.background} 100%)`;

    root.style.setProperty('--mesh-gradient', mesh);

    if (isDarkTheme) {
      root.style.setProperty('--glass-panel-bg', 'rgba(15, 23, 42, 0.58)');
      root.style.setProperty('--glass-panel-border', 'rgba(148, 163, 184, 0.14)');
      root.style.setProperty('--glass-sidebar-bg', 'rgba(15, 23, 42, 0.45)');
      root.style.setProperty('--glass-filter-bg', 'rgba(30, 41, 59, 0.55)');
      root.style.setProperty('--glass-table-header', 'rgba(30, 41, 59, 0.75)');
    } else {
      root.style.setProperty('--glass-panel-bg', 'rgba(255, 255, 255, 0.72)');
      root.style.setProperty('--glass-panel-border', 'rgba(255, 255, 255, 0.88)');
      root.style.setProperty('--glass-sidebar-bg', 'rgba(255, 255, 255, 0.78)');
      root.style.setProperty('--glass-filter-bg', 'rgba(255, 255, 255, 0.58)');
      root.style.setProperty('--glass-table-header', 'rgba(248, 250, 252, 0.94)');
    }

    document.body.style.background = '';
    document.body.style.color = theme.text;

    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themes, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


